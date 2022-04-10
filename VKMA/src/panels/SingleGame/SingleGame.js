import React from 'react';

import bridge from "@vkontakte/vk-bridge";

import {
    Panel,
    PanelHeader,
    Cell,
    PanelHeaderBack,
    PanelHeaderContent,
    Group,
    Button,
    FormItem,
    Input,
    Div,
    Header,
    FormStatus,
    Placeholder,
    Alert, Avatar, FixedLayout, Tappable
} from '@vkontakte/vkui';

import {Icon20ViewCircleFillRed, Icon28DoorArrowRightOutline} from '@vkontakte/icons';

import LocationCard from "../../components/LocationCard/LocationCard";
import Timer from "../../components/Timer/Timer";

import './SingleGame.scss';
import apiCall from "../../api";

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class PlayerCreator extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            roleShown: false
        }
    }

    createPlayer = () => {
        this.props.createPlayer(this.state.name);
        this.setState({name: '', roleShown: false});
    }

    render() {
        return (
            <Group header={<Header mode={'secondary'}>Расскажите о себе</Header>} className={"PlayerCreator"}>
                <FormItem>
                    <Input placeholder={'Ваш псевдоним'} value={this.state.name} onChange={e => this.setState({name: e.target.value})} disabled={this.state.roleShown}/>
                </FormItem>

                <Div>
                    {
                        !this.state.roleShown ?
                            <>
                                <FormStatus header={'Примечание'} style={{marginBottom: 12, textAlign: 'start'}}>
                                    После нажатия на кнопку «создать игрока» вы увидите свою роль. Никому её не показывайте!
                                </FormStatus>
                                <Button stretched size={'l'} disabled={this.state.name.length < 2} onClick={() => this.setState({roleShown: true})}>
                                    Создать игрока
                                </Button>
                            </>
                        :
                            <>
                                <FormStatus header={'Примечание'} style={{marginBottom: 12, textAlign: 'start'}}>
                                    {!this.props.isLast ? "Запомните свою роль, нажмите на кнопку и передайте устройство следующему игроку" : "Запомните свою роль, нажмите на кнопку и включите таймер"}
                                </FormStatus>

                                {this.state.roleShown &&
                                    <LocationCard description={this.props.isSpy ? "Локация неизвестна" : 'Вы обычный игрок'} name={this.props.isSpy ? "Вы шпион!" : ("Локация: " + this.props.location)}/>
                                }

                                <Button stretched size={'l'} disabled={this.state.name.length < 2} onClick={this.createPlayer}>
                                    {!this.props.isLast ? "Следующий игрок" : "Начать игру"}
                                </Button>
                            </>

                    }

                </Div>
            </Group>
        )
    }
}


export default class SingleGamePanel extends React.Component {
    constructor(props) {
        super(props);
        console.log(this.props.globState.panels.singleGame)
        this.state = this.props.globState.panels.singleGame || {
            snackbar: null,
            stage: 'meeting',
            location: '',
            players: [],
            playerIndex: 0,
            started: false
        }
    }

    componentWillUnmount() {
        this.props.setGlobalState({ panels: {...this.props.globState.panels, singleGame: this.state} });
    }

    componentDidMount() {
        if (!this.state.location) {
            apiCall('locations.get', {}).then(resp => {
                if (resp.success) {
                    let location = resp.locations[randomInteger(0, resp.locations.length - 1)];
                    this.setState({location: location.name})
                }
            })
        }

        let players = this.state.players;

        if (!players.length) {
            let playersCount = this.props.globState.playersCount;
            let spies = [];

            while (spies.length < (playersCount < 10 ? 1 : 2)) {
                let randomized = randomInteger(1, playersCount);
                if (!spies.includes(randomized)) {
                    spies.push(randomized)
                }
            }

            for (let i = 1; i <= playersCount; i++) {
                players.push({id: i, name: '', role: spies.includes(i) ? 'spy' : 'player'})
            }
            this.setState({players: players});
        }
    }

    createPlayer = (name) => {
        let players = this.state.players;
        players[this.state.playerIndex]['name'] = name;

        if (this.state.playerIndex + 1 < this.state.players.length) {
            this.setState({players: players, playerIndex: this.state.playerIndex + 1});
        } else {
            this.setState({players: players, stage: 'timer'}, () => {
                this.props.setGlobalState({timeLeft: this.state.players.length * 60});
            });
        }
    }

    startGame = () => {
        let interval = setTimeout(() => this.props.decreaseTime(), 1000)
        this.props.setGlobalState({timer: interval});
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
        if (this.props.globState.timer) {
            clearTimeout(this.props.globState.timer)
        }
        this.props.setGlobalState({timer: null, gameFinished: true, timeLeft: null});
    }

    render() {
        const { goBack, globState } = this.props;
        const { stage, playerIndex, players } = this.state;

        return (
            <Panel id={this.props.id}>
                <PanelHeader left={<PanelHeaderBack onClick={goBack}/>}>
                    <PanelHeaderContent status={stage === "meeting" ? "Знакомство игроков" : "В процессе"}>
                        Игра оффлайн
                    </PanelHeaderContent>
                </PanelHeader>

                {
                    !this.props.globState.gameFinished ?
                        <>
                            {
                                stage === 'meeting' &&
                                <Placeholder stretched>
                                    <PlayerCreator isSpy={players[playerIndex]?.role === 'spy'} createPlayer={this.createPlayer} location={this.state.location} isLast={playerIndex >= players.length - 1}/>
                                </Placeholder>
                            }

                            {
                                stage === 'timer' &&
                                <Placeholder stretched action={
                                    !globState.timer ?
                                        <Button size={'l'} onClick={this.startGame}>
                                            Начать игру
                                        </Button>
                                        :
                                        <Button size={'l'} mode={'destructive'} onClick={globState.timeLeft ? this.onGameEndClick : this.endGame}>
                                            Завершить игру
                                        </Button>
                                }>
                                    <Timer seconds={globState.timeLeft}/>
                                </Placeholder>
                            }
                        </>
                    :
                        <Group header={<Header mode={'secondary'}>Список игроков</Header>}>
                            {
                                players.sort(item => item.role === 'spy' ? -1 : 1).map((item, i) => (
                                    <Cell before={<Avatar src={'https://vk.com/images/camera_200.png'} badge={item.role === 'spy' && <Icon20ViewCircleFillRed/>}/>}
                                          description={item.role === 'spy' ? 'Шпион' : "Игрок"} disabled key={item.id}>
                                        {item.name + " "}
                                    </Cell>
                                ))
                            }
                        </Group>
                }

                {this.props.globState.gameFinished &&
                    <FixedLayout vertical={'bottom'}>
                        <Tappable className='CircleButton' onClick={this.props.goBack}>
                            <Icon28DoorArrowRightOutline/>
                        </Tappable>
                    </FixedLayout>
                }

                {this.state.snackbar}
            </Panel>
        )
    }
}
