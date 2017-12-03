import React, { Component } from 'react';
import axios from 'axios';
import './App.css';
import Canvas from './components/canvas';
import MainPicture from './components/mainPicture';
import LayerObj from './lib/config';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userChoice: '',
      photo: '',
      layoutAdd: [],
    };

    this.handleButton = this.handleButton.bind(this);
    this.changeState = this.changeState.bind(this);
  }

  componentWillMount() {
    axios({
      method: 'GET',
      url: 'http://localhost:5000/api'
    })
      .then((res) => {
        this.setState({
          photo: res.data,
        });
      });
  }

  changeState(prop, value) {
    const keyObj = {};
    keyObj[prop] = value;
    this.setState(keyObj);
  }

  async handleButton(event) {
    try {
      const stateFun = await this.changeState('userChoice', event.target.id);
      console.log(this.state.userChoice);
      if (this.state.userChoice === 'celebrity') {
        this.setState({
          layoutAdd: LayerObj.celList,
        });
        console.log(this.state.layoutAdd);
      } else {
          this.setState({
            layoutAdd: LayerObj.emojiList,
        });
      }
    }catch(err) {
      console.log(err);
    };
  }

  render() {
    return (
      <div className="App">
        <div className="button">
          <button id="celebrity" onClick={this.handleButton}>Celebrity</button>
          <button id="emojis" onClick={this.handleButton}>Emojis</button>
        </div>
        <div className="canvas">
          <Canvas
            choice={this.state.userChoice}
            photo={this.state.photo}
            layoutAdd={this.state.layoutAdd}
          />
        </div>
      </div>
    );
  }
}

export default App;
