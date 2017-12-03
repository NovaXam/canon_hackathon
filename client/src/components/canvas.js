import React from 'react';
import LayerObj from '../lib/config';
import MainPicture from './mainPicture';
import "./canvas.css";

const Canvas = (props) => {
  if (props.choice === 'celebrity') {
    return (
      <div className="canvesField">
        <MainPicture photo={props.photo} />
        {props.layoutAdd.map(function(elem, i) {
            return (
                <div className="icon" key={i} id={i}>
                  <img src={elem.path} />
                </div>
              );
        })
      }
      </div>
      );
  } else {
      return (
        <div className="canvesField">
          <MainPicture photo={props.photo} />
          {props.layoutAdd.map(function(elem, i) {
            return (
              <div className="icon" key={i} id={i}>
                <img src={elem.path} />
              </div>
            );
        })
      }
        </div>
    );
  }
};

export default Canvas;
