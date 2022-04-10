import React from 'react';

import {Card, Tappable} from '@vkontakte/vkui';

import './LocationCard.scss';
import {Icon24DeleteOutline} from "@vkontakte/icons";


export default class LocationCard extends React.Component {

    render() {
        const {name, id, index, description} = this.props;

        return (
            <Card mode={description ? 'outline' : 'shadow'} className={'LocationCard'}>
                <div className={'Wrapper'}>
                    {!description && <div className={'Index'}>#{index + 1}</div>}
                    <div className={'Name'}>
                        {name}
                        {description &&
                            <div className={'Description'}>{description}</div>
                        }
                    </div>

                    {!description &&
                        <div className={'DeleteButton'}>
                            <Tappable onClick={() => {this.props.delete(id)}}>
                                <Icon24DeleteOutline fill={'var(--destructive)'}/>
                            </Tappable>
                        </div>
                    }
                </div>

            </Card>
        )
    }
}
