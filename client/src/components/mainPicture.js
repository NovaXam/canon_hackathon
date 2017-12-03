import React from 'react';
import "./mainPicture.css";

const MainPicture = (props) => {
  return (
      <div className="fieldPicture">
        <img src={props.photo} alt="main picture"/>
      </div>
    );
};

export default MainPicture;
