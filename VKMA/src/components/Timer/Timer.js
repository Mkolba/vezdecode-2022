import React from 'react';

import { Icon24Flash } from '@vkontakte/icons';
import bridge from "@vkontakte/vk-bridge";
import './Timer.scss';


export default class Timer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timer: null,
            flash: false,
        }
    }

    componentWillUnmount() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            bridge.send("VKWebAppFlashSetLevel", {"level": 0});
        }
    }

    componentDidUpdate() {
        if (!this.state.timer && this.props.seconds < 1) {
            let timer = setInterval(this.toggleFlashlight, 1000);
            this.setState({timer: timer});
        }
    }

    toggleFlashlight = () => {
        bridge.send("VKWebAppFlashSetLevel", {"level": this.state.flash ? 0 : 1});
        this.setState({flash: !this.state.flash})
    }

    render() {
        const {seconds} = this.props;
        let minutesLeft = Math.floor(seconds / 60);
        let secondsLeft = seconds - minutesLeft * 60;

        return (
            <div className={'Timer'}>
                <div className={'Content'}>
                    <div className={'Header'}>
                       Осталось
                    </div>
                    <div className={'Time' + (minutesLeft < 1 ? " disabled" : '')}>
                        {minutesLeft < 10 && "0"}{minutesLeft}:{secondsLeft < 10 && "0"}{secondsLeft}
                    </div>
                </div>

                {seconds < 1 &&
                    <div className={'Lamp'}>
                        <Icon24Flash fill={'var(--destructive)'}/>
                    </div>
                }

            </div>
        )
    }
}
