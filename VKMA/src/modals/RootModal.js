import React from 'react';
import { ModalRoot } from '@vkontakte/vkui';

import SettingsModal from "./SettingsModal";


export default class RootModal extends React.Component {

  render() {

    let {activeModal, goBack} = this.props;

    return (
      <ModalRoot activeModal={activeModal} onClose={goBack}>
        <SettingsModal {...this.props} id='settingsModal' dynamicContentHeight/>
      </ModalRoot>
    )
  }
}
