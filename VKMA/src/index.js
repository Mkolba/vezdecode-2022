import React from "react";
import ReactDOM from "react-dom";
import bridge from "@vkontakte/vk-bridge";
import App from "./App";

function setScheme (scheme) {
  let isLight = ['bright_light', 'client_light', 'vkcom_light'].includes(scheme);
  document.getElementById('app__body').setAttribute('scheme', isLight ? 'bright_light' : 'space_gray');
  bridge.send('VKWebAppSetViewSettings', {
    'status_bar_style': isLight ? 'dark' : 'light',
    'action_bar_color': isLight ? '#ffffff' : '#191919',
    'navigation_bar_color': isLight ? '#ffffff' : '#191919',
  }).catch(e => {});
}

bridge.subscribe(({ detail: { type, data }}) => {
  if (type === 'VKWebAppUpdateConfig' && data.scheme) {
    setScheme(data.scheme);
  }
})

// Init VK  Mini App
bridge.send("VKWebAppInit");

ReactDOM.render(<App />, document.getElementById("root"));
if (process.env.NODE_ENV === "development") {
  import("./eruda").then(({ default: eruda }) => {}); //runtime download
}
