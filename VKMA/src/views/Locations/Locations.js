import React from 'react';
import apiCall from "../../api";
import bridge from "@vkontakte/vk-bridge";

import {
    Panel,
    PanelHeader,
    View,
    PanelHeaderBack,
    Placeholder,
    Alert,
    Input,
    FormItem,
    FormLayout,
    Button,
    PullToRefresh,
    Spinner,
    Tappable, FixedLayout
} from '@vkontakte/vkui';

import {
    Icon28AddOutline
} from "@vkontakte/icons";

import LocationCard from "../../components/LocationCard/LocationCard";
import './Locations.scss';
import api from "../../api";


class NameInputAlert extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            name: ''
        }
    }

    render() {
        return (
            <Alert header="Новая локация" onClose={this.props.onClose}>
                <div style={{marginTop: 20}} className={'AlertInput'}>
                    <FormLayout onSubmit={(e)=>{e.preventDefault(); if ([...this.state.name.trim()].length >= 2) this.props.create(this.state.name)}}>
                        <FormItem top={'Название локации'}>
                            <Input placeholder='Название' value={this.state.name} onChange={e => this.setState({name: [...e.target.value].slice(0, 64).join('')})} />
                        </FormItem>
                    </FormLayout>
                    <Button disabled={[...this.state.name.trim()].length < 2} stretched style={{ marginTop: 6 }} size='m' onClick={() => this.props.create(this.state.name)}>
                        Создать
                    </Button>
                </div>
            </Alert>
        )
    }
}


export default class LocationsView extends React.Component {

    constructor(props) {
        super(props);
        this.state = this.props.globState.panels.locations || {
            isFetching: false,
            snackbar: null,
            locations: []
        }
    }

    componentWillUnmount() {
        this.props.setGlobalState({ panels: {...this.props.globState.panels, locations: this.state} });
    }

    componentDidMount() {
        if (!this.state.locations.length) {
            this.fetchLocations()
        }
    }

    onLocationCreate = () => {
        this.props.showPopout(
            <NameInputAlert onClose={() => this.props.goBack()} create={this.createLocation}/>
        )
    }

    onDeleteLocation = (id) => {
        this.props.showPopout(
            <Alert
                actions={[{
                        title: "Удалить",
                        mode: "destructive",
                        autoclose: true,
                        action: () => this.deleteLocation(id)},
                    {
                        title: "Отмена",
                        autoclose: true,
                        mode: "cancel",
                    },
                ]}
                onClose={this.props.goBack}
                header="Подтвердите действие"
                text="Вы уверены, что хотите удалить эту локацию?"
            />
        )
    }

    deleteLocation = (id) => {
        this.props.goBack();
        this.props.toggleSpinner(true);
        apiCall('locations.delete', {id: id}).then(resp => {
            this.props.toggleSpinner(false);
            if (resp.success) {
                this.setState({locations: this.state.locations.filter(item => item.id !== id)})
            }
        }).catch(e => {
            this.props.toggleSpinner(false);
            console.log(e)
        })
    }

    createLocation = (name) => {
        this.props.goBack();
        this.props.toggleSpinner(true);
        apiCall('locations.create', {name: name}).then(resp => {
            this.props.toggleSpinner(false);
            if (resp.success) {
                this.setState({locations: [...this.state.locations, resp.location]})
            }
        }).catch(e => {
            this.props.toggleSpinner(false);
            console.log(e)
        })
    }

    fetchLocations = () => {
        this.setState({isFetching: true});
        apiCall('locations.get', {}).then(resp => {
            this.setState({locations: resp.locations, isFetching: false})
        }).catch(e => {
            this.setState({isFetching: false});
            console.log(e);
        })
    }

    render() {
        const {goBack, activePanels, history, globState} = this.props;
        const isDesktop = globState.isDesktop;

        let locations = [];
        for (let i=1; i < this.state.locations.length+1; i+=2 ) {
            let items = [<LocationCard {...this.state.locations[i-1]} key={this.state.locations[i-1]['id']} delete={this.onDeleteLocation} index={i-1}/>];
            if (this.state.locations[i]) {
                items.push(<LocationCard {...this.state.locations[i]} key={this.state.locations[i]['id']} delete={this.onDeleteLocation} index={i}/>)
            }
            locations.push(items)
        }

        return (
            <View id={this.props.id} activePanel={activePanels[this.props.id]} popout={this.props.popout}>
                <Panel id='locations_main'>
                    <PanelHeader>Локации</PanelHeader>

                    {
                        (this.state.isFetching && this.state.locations.length === 0) ?
                            <Placeholder stretched icon={<Spinner size={'l'}/>}/>
                        :
                            <PullToRefresh isFetching={this.state.isFetching} onRefresh={this.fetchLocations}>
                                <div className={'Locations'}>
                                    {locations.map((item, key) => (
                                        <div className={'LocationRow'} key={key}>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </PullToRefresh>
                    }

                    <FixedLayout vertical={'bottom'}>
                        <Tappable className='CircleButton' onClick={this.onLocationCreate}>
                            <Icon28AddOutline />
                        </Tappable>
                    </FixedLayout>

                    {this.state.snackbar}
                </Panel>
            </View>
        )
    }
}
