import React from 'react';

import {
    Tabbar, TabbarItem, Epic, SplitLayout, SplitCol, withAdaptivity, withPlatform
} from '@vkontakte/vkui';

import {
    Icon28LocationMapOutline, Icon28GameOutline
} from '@vkontakte/icons';

import GameView from "../../views/Game/Game";
import LocationsView from "../../views/Locations/Locations";


const RootEpicTabbar = (props) => (
    <Tabbar>
        <TabbarItem onClick={() => props.goToStory('locations')} selected={props.activeStory === 'locations'} text='Локации'>
            <Icon28LocationMapOutline width={24} height={24}/>
        </TabbarItem>

        <TabbarItem onClick={() => props.goToStory('game')} selected={props.activeStory === 'game'} text='Игра'>
            <Icon28GameOutline width={24} height={24}/>
        </TabbarItem>
    </Tabbar>
)


class RootEpic extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {globState, activeStory, goToStory} = this.props;

        return (
            <SplitLayout>
                <SplitCol spaced={false} width='100%' animate>
                    <Epic activeStory={activeStory} tabbar={globState.showTabbar && <RootEpicTabbar activeStory={activeStory} goToStory={goToStory} globState={globState}/>} className={!globState.showTabbar && "Epic--tabbar__hidden"}>
                        <LocationsView id='locations' {...this.props}/>
                        <GameView id='game' {...this.props}/>
                    </Epic>
                </SplitCol>

            </SplitLayout>
        )
    }
}

export default withPlatform(withAdaptivity(RootEpic, {viewWidth: true}));