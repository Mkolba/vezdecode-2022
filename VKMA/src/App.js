import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import {apiEndpoint} from "./api";

import {
	withAdaptivity, AppRoot, AdaptivityProvider, ConfigProvider, WebviewType, Alert, ScreenSpinner
} from '@vkontakte/vkui';

import RootEpic from './components/RootEpic/RootEpic.js';

import '@vkontakte/vkui/dist/vkui.css';
import './index.scss'


class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {
			activeStory: 'game',
			activeModal: null,
			activePanels: {
				'locations': 'locations_main',
				'game': 'game_main'
			},
			history: {
				'locations': ['locations_main'],
				'game': ['game_main']
			},
			popout: null,
			globState: {
				isDesktop: window.innerWidth >= 768,
				showTabbar: true,
				modalData: {},
				user: {},
				panels: {},
				timer: null,
				onStartUp: true,
			},
			backButtonTimeout: null,
		}
	}

	componentDidMount() {
		window.onpopstate = this.goBack;
		bridge.subscribe(({ detail: { type, data }}) => {
			if (type === 'VKWebAppUpdateConfig' && data.scheme) {
				this.setScheme(data.scheme);
			}
		})

		bridge.send("VKWebAppGetUserInfo").then(resp => {
			this.setGlobalState({ user: resp })
		});
	}

	connectToSocket = (lobby, name, handler) => {
		const endpoint = 'wss://' + apiEndpoint + 'ws' + window.location.search + `&lobby=${lobby}&name=${name}&avatar=${encodeURIComponent(this.state.globState.user.photo_200)}`;
		let socket = new WebSocket(endpoint);
		this.setGlobalState({socket: socket});

		socket.onclose = (e) => {
			this.setState({connected: false});
		};

		socket.onmessage = (event) => {
			event = JSON.parse(event.data);
			console.log(event);

			if (event.type === 'connected') {
				delete event.type;
				this.setGlobalState({...event})
			} else if (event.type === 'join') {
				let lobby = this.state.globState.lobby;
				this.setGlobalState({lobby: {...lobby, players: {...lobby.players, ...event.user}}})
			} else if (event.type === 'shuffled') {
				this.setGlobalState({myRole: event.role, timeLeft: event.timeLeft, isGameStarted: false, location: event.location, timer: true})
			} else if (event.type === 'start') {
				this.setGlobalState({isGameStarted: true});
			} else if (event.type === 'stop') {
				this.setGlobalState({isGameFinished: true, lobby: {...this.state.globState.lobby, players: {...event.players}}});
			} else if (event.type === 'timer') {
				this.setGlobalState({timeLeft: event.timeLeft})
			} else if (event.type === 'destruct') {
				this.goBack(true, null, true);
				this.setGlobalState({
					lobby: null, isGameStarted: false, isGameFinished: false, myRole: null,
					location: null, timer: false
				})
				socket.close();
			} else if (event.type === 'disconnect') {
				let players = Object.fromEntries(Object.entries(this.state.globState.lobby.players).filter(([k, item]) => k != event.user))
				console.log(players)
				this.setGlobalState({lobby: {...lobby, players: {...players}}})
			} else {
				handler(event)
			}
		}

		socket.onerror = (error) => {
			console.log(error)
		}

		socket.onclose = (e) => {
			if (e.code === 2400) {
				this.goBack(true, () => this.openAlert('Такого лобби не существует', true), true);
				this.setGlobalState({
					lobby: null, isGameStarted: false, isGameFinished: false, myRole: null,
					location: null, timer: false
				})
			}
		}
	}

	blockBackButton = () => {
		if (this.state.backButtonTimeout) {
			clearTimeout(this.state.backButtonTimeout);
			this.setState({ backButtonTimeout: null });
		}
		let timeout = setTimeout(() => {this.setState({ backButtonTimeout: null })}, 400)
		this.setState({ backButtonTimeout: timeout });
	}

	toggleTabbar = (state) => {
		let isLight = this.state.globState.scheme === 'bright_light';
		this.setGlobalState({ showTabbar: state }, () => {
			bridge.send('VKWebAppSetViewSettings', {
				'status_bar_style': isLight ? 'dark' : 'light',
				'action_bar_color': isLight ? '#ffffff' : '#191919',
				'navigation_bar_color': state ? (isLight ? '#ffffff' : '#2c2d2e') : (isLight ? '#ffffff' : '#191919'),
			}).then(resp => console.log(resp)).catch(e => console.log(e.error_data));
		});
	}

	setScheme = (scheme) => {
		let isLight = ['bright_light', 'client_light'].includes(scheme);
		this.setGlobalState({ scheme: isLight ? 'bright_light' : 'space_gray' });
	}

	showPopout = (popout, closable=true) => {
		let history = this.state.history;
		while (history[this.state.activeStory][history[this.state.activeStory].length - 1].includes('popout')) {
			history[this.state.activeStory].pop();
		}
		let newHistoryObj = `popout.${closable ? "closable" : "nonclosing"}`;
		window.history.pushState({panel: this.state.activePanel + ".popout"}, newHistoryObj);
		history[this.state.activeStory] = [...history[this.state.activeStory], newHistoryObj];
		this.setState({ history, popout });
		this.blockBackButton();
	}

	toggleSpinner = (state) => {
		if (state === true) {
			this.showPopout(<ScreenSpinner/>, false);
		} else {
			this.goBack(true);
		}
	}

	openModal = (modal, data) => {
		this.blockBackButton();
		let history = this.state.history;
		window.history.pushState({panel: 'modal'}, 'modal');
		history[this.state.activeStory] = [...history[this.state.activeStory], 'modal'];
		this.setState({ globState: {...this.state.globState, modalData: data}, activeModal: modal, history: history });
	}

	go = (panel) => {
		let history = this.state.history;
		let activePanels = this.state.activePanels;

		window.history.pushState({panel: panel}, panel);
		activePanels[this.state.activeStory] = panel;
		history[this.state.activeStory] = [...history[this.state.activeStory], panel];

		this.setState({ history, activePanels });
		this.blockBackButton();
	}

	goBack = (closePopout, cb, force) => {

		if (!force && this.state.backButtonTimeout) {
			window.history.pushState({panel: 'block'}, 'block');
			return;
		}

		let history = this.state.history[this.state.activeStory];
		let lastObject = history[history.length - 1];
		let activePanels = this.state.activePanels;

		if (history.length === 1 || lastObject === 'popout.returnable') {
			if (lastObject === 'popout.returnable') {
				this.setState({popout: null})
			}
			if (this.state.activeStory === 'game') {
				bridge.send("VKWebAppClose", {"status": "success" });
			}
		} else {
			if (lastObject === 'popout.nonclosing') {
				if (!closePopout) {
					window.history.pushState({panel: this.state.activePanel + ".popout"}, lastObject);
					return;
				} else {
					this.setState({ popout: null });
				}
			} else if (lastObject === 'popout.closable') {
				this.setState({ popout: null });
			} else if (lastObject === 'modal') {
				this.setState({ activeModal: null });
			} else if (!force && (lastObject === 'game_offline' || lastObject === 'game_online')) {
				return this.showPopout(
					<Alert header={'Подтвердите выход'} text={'При выходе из игры весь прогресс будет утерян'} actions={[
						{title: 'Выйти', mode: 'default', action: () => {
								this.goBack(true, () => this.goBack(true, null, true));

								setTimeout(() => {
									if (this.state.globState.timer) {
										clearTimeout(this.state.globState.timer)
									}

									if (this.state.globState.socket) {
										this.state.globState.socket.close();
										this.setGlobalState({
											lobby: null, isGameStarted: false, isGameFinished: false, myRole: null,
											location: null, timer: false, socket: null,
										})
									}

									this.setGlobalState({panels: {locations: this.state.globState.panels.locations}, timer: null, gameFinished: false, timeLeft: null});
								}, 500)
							}},
						{title: 'Отмена', autoclose: true, mode: 'default'},
					]}
						   onClose={() => this.goBack(true, cb)}/>
				)
			} else {
				activePanels[this.state.activeStory] = history[history.length - (!history[history.length - (2)].includes('popout') ? 2 : 3)];
			}

			this.setState({ activePanels });
			this.blockBackButton();
			history.pop();
			if (cb) {cb()}
		}
	}

	openAlert = (text, onError, title, cb) => {
		if (!title) {
			title = onError ? 'Что-то пошло не так :C' : 'Действие выполнено'
		}
		if (!text && onError) {
			text = "Нам не удалось достучаться до сервера. Повторите попытку позже."
		}
		this.showPopout(
			<Alert actions={[{title: 'Закрыть', autoclose: true, mode: 'default'}]}
				   onClose={() => this.goBack(true, cb)}>
				<h2>{title}</h2>
				<p>{text}</p>
			</Alert>, true
		)
	}

	goToStory = (story) => {
		this.setState({ activeStory: story });
	}

	setGlobalState = (data, cb) => {
		let globalState = {...this.state.globState, ...data};
		this.setState({ globState: globalState }, () => {
			if (cb) {cb()}
			console.log(this.state)
		});
	}

	decreaseTime = () => {
		let timeLeft = this.state.globState.timeLeft - 1;
		if (timeLeft > 0) {
			let interval = setTimeout(() => this.decreaseTime(), 1000)
			this.setGlobalState({timeLeft: timeLeft, timer: interval});
		} else {
			clearTimeout(this.state.globState.timer);
			this.setGlobalState({timeLeft: 0});
		}
	}

	render() {

		const props = {
			go: this.go, goBack: this.goBack, globState: this.state.globState, showPopout: this.showPopout,
			activeStory: this.state.activeStory, goToStory: this.goToStory, activePanels: this.state.activePanels,
			toggleTabbar: this.toggleTabbar, openModal: this.openModal, activeModal: this.state.activeModal,
			setGlobalState: this.setGlobalState, openAlert: this.openAlert, toggleSpinner: this.toggleSpinner,
			popout: this.state.popout, decreaseTime: this.decreaseTime, connectToSocket: this.connectToSocket
		};

		return (
			<ConfigProvider webviewType={WebviewType.VKAPPS}>
				<AdaptivityProvider>
					<AppRoot sizeX='compact'>
						<RootEpic {...props}/>
					</AppRoot>
				</AdaptivityProvider>
			</ConfigProvider>
		)
	}
}

export default withAdaptivity(App, {viewWidth: true});
