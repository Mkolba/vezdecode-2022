import React from 'react';
import { ModalPageHeader, PanelHeaderButton, IS_PLATFORM_IOS, IS_PLATFORM_ANDROID, Separator } from '@vkontakte/vkui';
import { Icon24Cancel, Icon24Dismiss } from '@vkontakte/icons';


const Header = (props) => {
  const isDesktop = window.innerWidth >= 768;
  return (
    <>
      <ModalPageHeader
        left={(!isDesktop && IS_PLATFORM_ANDROID) && <PanelHeaderButton onClick={() => window.history.back()}><Icon24Cancel /></PanelHeaderButton>}
        right={(!isDesktop && IS_PLATFORM_IOS) && <PanelHeaderButton onClick={() => window.history.back()}><Icon24Dismiss /></PanelHeaderButton>}
      >
        {props.title}
      </ModalPageHeader>
      {!props.hideSeparator && <Separator/>}
    </>
  )
}

export default Header;
