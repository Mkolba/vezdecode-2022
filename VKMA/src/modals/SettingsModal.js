import React from 'react';

import {
    ModalPage, withModalRootContext, Group, Header, FormItem, Slider, FormLayout, Button, Div, Input, Tabs, TabsItem
} from '@vkontakte/vkui';

import ModalPageHeader from './Header.js';


class SettingsModalContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            players: 3,
            name: this.props.globState.user.first_name || '',
            activeTab: this.props.globState.selectedLobby ? 'join' : 'create',
            lobby: this.props.globState.selectedLobby || ''
        }
    }

    changeTab = (tab) => {
        this.setState({activeTab: tab});
        this.props.updateModalHeight();
    }

    render() {
        return (
            <Group>
                {this.props.type === 'offline' ?
                    <>
                        <FormLayout>
                            <FormItem top={'Количество игроков: ' + this.state.players} bottom={"В игре будет " + (this.state.players < 10 ? "1 шпион" : "2 шпиона")}>
                                <Slider min={3} max={12} step={1} value={this.state.players} onChange={players => this.setState({players: players})}/>
                            </FormItem>
                        </FormLayout>

                        <Div>
                            <Button stretched size={'l'} onClick={() => this.props.globState.modalData.start(this.props.type, this.state.players)}>
                                Начать игру
                            </Button>
                        </Div>
                    </>
                    :
                    <>
                        <Tabs>
                            <TabsItem selected={this.state.activeTab === 'create'} onClick={() => this.changeTab('create')}>
                                Создать лобби
                            </TabsItem>
                            <TabsItem selected={this.state.activeTab === 'join'} onClick={() => this.changeTab('join')}>
                                Подключиться
                            </TabsItem>
                        </Tabs>
                        {this.state.activeTab === 'create' ?
                            <>
                                <FormLayout>
                                    <FormItem top={'Ваш псевдоним'} bottom={'В лобби будет допущено до 12 человек'}>
                                        <Input value={this.state.name} placeholder={'Имя'} onChange={name => this.setState({name: name.target.value})}/>
                                    </FormItem>
                                </FormLayout>

                                <Div>
                                    <Button stretched size={'l'} onClick={() => this.props.globState.modalData.start(this.props.type, 12, this.state.name)} disabled={this.state.name.length < 2}>
                                        Создать лобби
                                    </Button>
                                </Div>
                            </>
                            :
                            <>
                                <FormLayout>
                                    <FormItem top={'Ваш псевдоним'}>
                                        <Input value={this.state.name} placeholder={'Имя'} onChange={name => this.setState({name: name.target.value})}/>
                                    </FormItem>
                                    <FormItem top={'Номер лобби'}>
                                        <Input type='number' value={this.state.lobby} placeholder={'Лобби'} onChange={name => this.setState({lobby: name.target.value})}/>
                                    </FormItem>
                                </FormLayout>

                                <Div>
                                    <Button stretched size={'l'} onClick={() => this.props.globState.modalData.start(this.props.type, 12, this.state.name, this.state.lobby)} disabled={this.state.name.length < 2 || !this.state.lobby}>
                                        Подключиться
                                    </Button>
                                </Div>
                            </>
                        }
                    </>
                }

            </Group>
        )
    }
}

SettingsModalContent = withModalRootContext(SettingsModalContent);

export default class SettingsModal extends React.Component {
    render() {
        let {globState, goBack, id, dynamicContentHeight} = this.props;
        let headerProps = {title: globState.modalData.type === 'offline' ? 'Новая игра' : "Онлайн игра", goBack: globState.modalData.goBack, hideSeparator: true};

        return (
            <ModalPage id={id} onClose={() => globState.modalData.goBack()} header={<ModalPageHeader {...headerProps}/>} dynamicContentHeight={dynamicContentHeight}>
                <SettingsModalContent {...this.props} type={globState.modalData.type}/>
            </ModalPage>
        )
    }
}
