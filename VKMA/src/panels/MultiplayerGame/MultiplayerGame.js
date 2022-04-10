import React from 'react';

import bridge from "@vkontakte/vk-bridge";

import {
    Panel,
    PanelHeader,
    View,
    PanelHeaderBack,
    PanelHeaderContent,
    Avatar,
    Cell,
    Group,
    Footer,
    Button,
    Spinner,
    Placeholder,
    FixedLayout, Tappable, Snackbar, Alert, Link
} from '@vkontakte/vkui';

import {
    Icon20ViewCircleFillRed,
    Icon28DoorArrowRightOutline, Icon28Play

} from "@vkontakte/icons";

import './MultiplayerGame.scss';
import Timer from "../../components/Timer/Timer";
import LocationCard from "../../components/LocationCard/LocationCard";


export default class MultiplayerGamePanel extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.props.globState.panels.multiplayerGame || {
            snackbar: null
        }
    }

    componentWillUnmount() {
        this.props.setGlobalState({ panels: {...this.props.globState.panels, multiplayerGame: {}} });
    }

    componentDidMount() {
        if (!this.props.globState.socket || [2,3].includes(this.props.globState.socket.readyState)) {
            this.props.connectToSocket(this.props.globState.selectedLobby || this.props.globState.user.id, this.props.globState.nickname, this.handleEvent);
        }
    }

    shuffle = () => {
        this.props.globState.socket.send(JSON.stringify({type: 'shuffle'}))
    }

    startGame = () => {
        this.props.globState.socket.send(JSON.stringify({type: 'start'}))
    }

    handleEvent = (event) => {
        if (event.type === 'error') {
            this.setState({snackbar: (
                <Snackbar onClose={() => this.setState({snackbar: null})}>
                    {event.message}
                </Snackbar>
            )})
        }
    }

    destruct = () => {
        this.props.globState.socket.send(JSON.stringify({type: 'destruct'}))
    }

    onGameEndClick = () => {
        this.props.showPopout(
            <Alert header={'Подтвердите конец игры'} text={'При завершении игры вы увидите список всех шпионов и игроков'} actions={[
                {title: 'Завершить игру', mode: 'default', action: () => {
                        this.props.goBack(true);
                        setTimeout(this.endGame, 500)
                    }},
                {title: 'Отмена', autoclose: true, mode: 'default'},
            ]}
                   onClose={() => this.props.goBack(true)}/>
        )
    }

    endGame = () => {
        this.props.globState.socket.send(JSON.stringify({type: 'stop'}))
    }

    render() {
        const {goBack, activePanels, history, globState} = this.props;
        const {lobby, isGameStarted, timer, timeLeft, socket, myRole, location, isGameFinished} = globState;
        let status = (socket && socket.readyState === 0) ? 'Подключение...' : !isGameStarted ? 'Ожидание...' :  isGameFinished ? 'Завершена' : 'В процессе';

        return (
            <Panel id={this.props.id}>
                <PanelHeader left={<PanelHeaderBack onClick={goBack}/>}>
                    <PanelHeaderContent status={status}>
                        Игра онлайн
                    </PanelHeaderContent>
                </PanelHeader>

                {(socket && socket.readyState === 0) &&
                    <Placeholder stretched>
                        <Spinner sile={'large'}/>
                    </Placeholder>
                }

                {(socket && !isGameStarted && lobby && !timeLeft && !timer && !isGameFinished) &&
                    <>
                        <Group>
                            {
                                Object.entries(lobby.players).map(([id, item]) => (
                                    <Cell before={<Avatar src={item.ava}/>} description={'Готов к игре'} key={id}>
                                        {item.name}
                                    </Cell>
                                ))
                            }
                        </Group>

                        {lobby.is_owner &&
                            <FixedLayout vertical={'bottom'}>
                                <Tappable className='CircleButton' onClick={this.shuffle}>
                                    <Icon28Play/>
                                </Tappable>
                            </FixedLayout>
                        }
                    </>
                }

                {(socket && lobby && timer && !isGameFinished) &&
                    <>
                        {lobby.is_owner ?
                            <Placeholder stretched action={
                                !isGameStarted ?
                                    <Button size={'l'} onClick={this.startGame}>
                                        Начать игру
                                    </Button>
                                    :
                                    <Button size={'l'} mode={'destructive'} onClick={timeLeft ? this.onGameEndClick : this.endGame}>
                                        Завершить игру
                                    </Button>
                            }>
                                <div className={'flex'}>
                                    <Timer seconds={timeLeft}/>
                                    <LocationCard description={myRole === 'spy' ? "Локация неизвестна" : 'Вы обычный игрок'} name={myRole === 'spy' ? "Вы шпион!" : ("Локация: " + location)}/>
                                </div>
                            </Placeholder>
                            :
                            <Placeholder stretched action={
                                (!isGameStarted || !timeLeft) ?
                                    <Button size={'l'} disabled>
                                        Ожидание ведущего
                                    </Button>
                                    :
                                    <Button size={'l'} mode={'destructive'} disabled>
                                        Игра в процессе
                                    </Button>
                            }>
                                <div className={'flex'}>
                                    <Timer seconds={timeLeft}/>
                                    <LocationCard description={myRole === 'spy' ? "Локация неизвестна" : 'Вы обычный игрок'} name={myRole === 'spy' ? "Вы шпион!" : ("Локация: " + location)}/>
                                </div>
                            </Placeholder>
                        }
                    </>
                }

                {
                    (socket && isGameFinished) &&
                        <>
                            <Group>
                                {
                                    Object.entries(lobby.players).sort(([_, item]) => item.role === 'spy' ? -1 : 1).map(([id, item]) => (
                                        <Cell before={<Avatar src={item.ava} badge={item.role === 'spy' && <Icon20ViewCircleFillRed/>}/>} description={item.role === 'spy' ? 'Шпион' : 'Обычный игрок'} key={id}>
                                            {item.name}
                                        </Cell>
                                    ))
                                }
                            </Group>

                            {lobby.is_owner &&
                                <FixedLayout vertical={'bottom'}>
                                    <Tappable className='CircleButton' onClick={this.destruct}>
                                        <Icon28DoorArrowRightOutline/>
                                    </Tappable>
                                </FixedLayout>
                            }
                        </>
                }

                {(socket && !isGameStarted && lobby && !timeLeft && !timer && !isGameFinished) &&
                    <FixedLayout vertical={'bottom'} className={'GameFooter'}>
                        <Footer>
                            Лобби #{globState.selectedLobby || globState.user.id}<br/>
                            <Link onClick={() => bridge.send("VKWebAppShare", {"link": "https://vk.com/app7185029#lobby=" + (globState.selectedLobby || globState.user.id)})}>
                                Позвать друзей
                            </Link>
                        </Footer>
                    </FixedLayout>
                }

                {this.state.snackbar}
            </Panel>
        )
    }
}
