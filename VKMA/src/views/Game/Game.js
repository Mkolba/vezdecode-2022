import React from 'react';

import bridge from "@vkontakte/vk-bridge";

import {
    Panel, PanelHeader, View, PanelHeaderBack, Div, Button, Placeholder
} from '@vkontakte/vkui';

import {
    Icon20GlobeOutline, Icon20GlobeCrossOutline
} from "@vkontakte/icons";

import MultiplayerGamePanel from "../../panels/MultiplayerGame/MultiplayerGame";
import SingleGamePanel from "../../panels/SingleGame/SingleGame";

import RootModal from "../../modals/RootModal";

import './Game.scss';


export default class GameView extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.props.globState.panels.game || {
            snackbar: null,
        }
    }


    componentWillUnmount() {
        this.props.setGlobalState({ panels: {...this.props.globState.panels, game: {}} });
    }

    componentDidMount() {
        if (this.props.globState.onStartUp && window.location.hash) {
            let lobby_id = window.location.hash.match('lobby=([0-9]+)')
            if (lobby_id.length > 1) {
                setTimeout(() => {
                    this.props.setGlobalState({onStartUp: false, selectedLobby: lobby_id[1]}, () => {
                        this.props.openModal('settingsModal', {
                            goBack: this.props.goBack, type: 'online', start: this.startGame
                        })
                    })
                }, 500)
            }
        }
    }

    startGame = (type, players, name, lobby) => {
        this.props.goBack();
        this.props.setGlobalState({playersCount: players, nickname: name, selectedLobby: lobby}, () => {
            if (type === 'offline') {
                this.props.go('game_offline')
            } else {
                this.props.go('game_online')
            }
        });
    }

    render() {
        const {go, goBack, activePanels, globState, openModal} = this.props;
        const isDesktop = globState.isDesktop;

        return (
            <View id={this.props.id} activePanel={activePanels[this.props.id]} popout={this.props.popout} modal={<RootModal {...this.props}/>}>
                <Panel id={'game_main'}>
                    <PanelHeader>Новая игра</PanelHeader>
                    <Placeholder stretched>
                        <Div className={'Buttons'}>
                            <Button size={'l'} before={<Icon20GlobeCrossOutline width={24} height={24}/>} onClick={_ => openModal('settingsModal', {goBack: goBack, type: 'offline', start: this.startGame})}>
                                Играть оффлайн
                            </Button>
                            <Button size={'l'} before={<Icon20GlobeOutline width={24} height={24}/>} onClick={_ => openModal('settingsModal', {goBack: goBack, type: 'online', start: this.startGame})}>
                                Играть онлайн
                            </Button>
                        </Div>
                    </Placeholder>
                    {this.state.snackbar}
                </Panel>

                <MultiplayerGamePanel {...this.props} id={'game_online'} />
                <SingleGamePanel {...this.props} id={'game_offline'} />
            </View>
        )
    }
}
