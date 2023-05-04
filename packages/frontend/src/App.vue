<script setup lang="ts">
import { io, Socket } from "socket.io-client";
import { ref, onMounted, onUnmounted } from "vue";
import { download, readAsArrayBuffer } from "./utils/index";
import { User } from "@webrtc/types";

const equipmentType: Record<string | number, string> = {
  1: "icon-windows",
  2: "icon-Macmini",
  3: "icon-iPhoneX",
  4: "icon-zhikeshuma-",
  5: "icon-anzhuo",
};

const users = ref<User[]>([]);
const local = ref<User>({
  name: "",
  avatar: "1",
  id: "",
});
const visible = ref<Record<"transmit" | "user", boolean>>({
  transmit: false,
  user: false,
});
const progress = ref<number>(0);
const direction = ref<"source" | "target">();

let socket: Socket | null;
let selectedFile: File;
let receivedFile: {
  file: ArrayBuffer[];
  size: number;
  receivedSize: number;
  name?: string;
} = {
  file: [],
  size: 0,
  receivedSize: 0,
};

let peerConnection: RTCPeerConnection;
let sendChannel: RTCDataChannel;
let receiveChannel: RTCDataChannel;

onMounted(() => {
  getUserInfo();
});

onUnmounted(() => {
  socket?.close();
  disconnectPeers();
});

const getUserInfo = () => {
  const currentUser = localStorage.getItem("user");
  if (currentUser) {
    local.value = { ...JSON.parse(currentUser), id: local.value.id };
    connectSocket({ ...JSON.parse(currentUser) });
  } else {
    visible.value.user = true;
  }
};

const connectSocket = (user: Omit<User, "id">) => {
  socket = io({
    query: user,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log(socket);
  });

  socket.on("users", (e) => {
    users.value = e;
  });

  socket.on("user", (data) => {
    local.value.id = data.id;
  });

  socket.on("receiveOffer", (data) => {
    connectPeers();
    createAnswer(data);
  });

  socket.on("receiveAnswer", async (data) => {
    peerConnection.setRemoteDescription(JSON.parse(data.data.sdp));
  });
};

const createOffer = async (user: string) => {
  peerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate) {
      const sdp = JSON.stringify(peerConnection.localDescription);
      if (sdp) {
        socket?.emit("offer", {
          user,
          sdp,
          candidate: JSON.stringify(event.candidate),
        });
      }
    } else {
      console.log("候选人收集完成！");
    }
  };
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
};

const createAnswer = async (data: {
  source: string;
  data: {
    sdp: string;
    candidate: string;
  };
}) => {
  const offer = JSON.parse(data.data.sdp);
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      socket?.emit("answer", {
        user: data.source,
        sdp: JSON.stringify(peerConnection.localDescription),
        candidate: JSON.stringify(event.candidate),
      });
    }
  };
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
};

const handleSendChannelStatusChange = (event: Event) => {
  if (sendChannel) {
    console.log(sendChannel.readyState, event);
  }
};
const connectPeers = () => {
  peerConnection = new RTCPeerConnection();
  peerConnection.addEventListener("connectionstatechange", (event) => {
    console.log(event);
  });
  peerConnection.addEventListener("datachannel", (event) => {
    receiveChannel = event.channel;
    receiveChannel.onmessage = (e) => {
      receiveFile(e.data);
    };
  });
  sendChannel = peerConnection.createDataChannel("sendChannel");
  sendChannel.onopen = handleSendChannelStatusChange;
  sendChannel.onclose = handleSendChannelStatusChange;
};

const disconnectPeers = () => {
  sendChannel?.close();
  receiveChannel?.close();
  peerConnection?.close();
};

const receiveFile = (data: ArrayBuffer) => {
  if (typeof data === "string") {
    const fileInfo = JSON.parse(data);
    receivedFile.size = fileInfo.size;
    receivedFile.name = fileInfo.name;
    direction.value = "target";
    visible.value.transmit = true;
    progress.value = 0;
    return;
  }

  receivedFile.file.push(data);
  receivedFile.receivedSize += data.byteLength;
  progress.value = parseInt(
    (receivedFile.receivedSize / receivedFile.size) * 100 + ""
  );

  if (receivedFile.size === receivedFile.receivedSize) {
    download(receivedFile);
    progress.value = 100;
    visible.value.transmit = false;
    receivedFile = {
      file: [],
      size: 0,
      receivedSize: 0,
    };
  }
};

const sendFile = async () => {
  console.log(sendChannel.readyState);
  sendChannel.send(
    JSON.stringify({
      name: selectedFile.name,
      size: selectedFile.size,
    })
  );

  let offset = 0;
  let buffer: ArrayBuffer;
  const chunkSize = peerConnection.sctp?.maxMessageSize || 65535;
  while (offset < selectedFile.size) {
    const slice = selectedFile.slice(offset, offset + chunkSize);
    buffer =
      typeof slice.arrayBuffer === "function"
        ? await slice.arrayBuffer()
        : await readAsArrayBuffer(slice);
    if (sendChannel.bufferedAmount > chunkSize) {
      await new Promise((resolve) => {
        sendChannel.onbufferedamountlow = resolve;
      });
    }

    sendChannel.send(buffer);
    progress.value = parseInt((offset / selectedFile.size) * 100 + "");
    offset += buffer.byteLength;
  }
  progress.value = 100;
  visible.value.transmit = false;
};

const handleFileInputChange = async (id: string, e: Event) => {
  connectPeers();
  createOffer(id);
  const file = (e.target as HTMLInputElement)?.files?.[0];
  if (file) {
    selectedFile = file;
    visible.value.transmit = true;
    direction.value = "source";
    progress.value = 0;
    receivedFile = {
      size: file.size,
      name: file.name,
      receivedSize: 0,
      file: [],
    };
  }
};

const closeModal = () => {
  visible.value.transmit = false;
  visible.value.user = false;
};

const showUserInfoModal = () => {
  visible.value.user = true;
};

const updateUserInfo = () => {
  visible.value.user = false;
  if (local.value.name && local.value.avatar) {
    const { id, ...info } = local.value;
    localStorage.setItem("user", JSON.stringify(info));
    if (socket) {
      socket.emit("user", info);
    } else {
      connectSocket({ ...info });
    }
  }
};

const reload = () => {
  window.location.reload();
};
</script>

<template>
  <a-space style="width: 100%" direction="vertical">
    <a-button type="primary" @click="showUserInfoModal">{{
      local.name
    }}</a-button>
    <div>
      <div class="col-span-full" v-for="user in users">
        <div
          v-show="user.id !== local.id"
          class="transition-all bg-green-50 hover:bg-green-100 mt-2 flex rounded-lg px-3 py-3"
        >
          <div class="text-center">
            <div class="flex text-sm leading-6 text-gray-600">
              <label
                :for="user.id"
                class="relative cursor-pointer rounded-md font-semibold text-gray-500 hover:text-gray-600"
              >
                <span
                  ><i
                    :class="`pr-2 iconfont ${
                      user.avatar ? equipmentType[user.avatar] : 'icon-windows'
                    }`"
                  />{{ user.name ?? user.id }}</span
                >
                <input
                  @change="handleFileInputChange(user.id, $event)"
                  :id="user.id"
                  name="file-upload"
                  type="file"
                  class="sr-only"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-space>
  <a-modal
    v-model:visible="visible.transmit"
    :title="receivedFile.name"
    :maskClosable="false"
  >
    <template #footer>
      <a-button
        v-show="direction === 'source'"
        key="submit"
        type="primary"
        @click="sendFile"
        >发送</a-button
      >
      <a-button v-show="direction === 'source'" key="back" @click="closeModal"
        >取消</a-button
      >
    </template>
    <a-space :size="20">
      <div class="text-gray-500">
        文件大小:
        {{ parseInt(receivedFile.size / 1024 / 1024 + "") }}M
      </div>
      <a-progress
        type="circle"
        :percent="progress"
        :width="80"
        strokeColor="black"
        :success="{ strokeColor: 'black' }"
      />
    </a-space>
  </a-modal>
  <a-modal
    v-model:visible="visible.user"
    title="给自己起个名字"
    :maskClosable="false"
  >
    <template #footer>
      <a-button key="submit" type="primary" @click="updateUserInfo"
        >确定</a-button
      >
      <a-button key="back" @click="closeModal">取消</a-button>
    </template>
    <a-space style="width: 100%" direction="vertical" size="large">
      <a-input v-model:value="local.name" />
      <a-radio-group v-model:value="local.avatar">
        <a-radio :value="1">
          <i class="pr-2 iconfont icon-windows cursor-pointer"
        /></a-radio>
        <a-radio :value="2">
          <i class="pr-2 iconfont icon-Macmini cursor-pointer"
        /></a-radio>
        <a-radio :value="3">
          <i class="pr-2 iconfont icon-iPhoneX cursor-pointer"
        /></a-radio>
        <a-radio :value="4">
          <i class="pr-2 iconfont icon-zhikeshuma- cursor-pointer"
        /></a-radio>
        <a-radio :value="5">
          <i class="pr-2 iconfont icon-anzhuo cursor-pointer"
        /></a-radio>
      </a-radio-group>
    </a-space>
  </a-modal>
  <div class="floatButton">
    <a-button type="primary" @click="reload"> ⚡️ refresh </a-button>
  </div>
</template>

<style>
.ant-modal-footer {
  border-top: none !important;
}

.floatButton {
  position: fixed;
  z-index: 1;
  bottom: 20px;
  right: 20px;
}
</style>
