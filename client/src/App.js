import React, { Component, useEffect, useState } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Identicon from 'react-identicons';
import {
  Navbar,
  NavbarBrand,
  UncontrolledTooltip
} from 'reactstrap'
import Editor from 'react-medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import './App.css';

const client = new W3CWebSocket('ws://127.0.0.1:8000');
const contentDefaultMessage = "Start writing your document here";

const App = () => {
  const [user, setUser] = useState('')
  const [username, setUsername] = useState('')
  const [currentUsers, setCurrentUsers] = useState([])
  const [text, setText] = useState('')
  const [userActivity, setUserActivity] = useState([])

  const logInUser = () => {
    const username = user
    if (username.trim()) {
      setUsername(username)
    }
  }

    /* When content changes, we send the
current content of the editor to the server. */
 const onEditorStateChange = (text) => {
  client.send(JSON.stringify({
    type: "contentchange",
    username,
    content: text
  }));
};

  useEffect(() => {
    if(username) {
      client.send(JSON.stringify({
        username,
        type: "userevent"
      }))
    }
  },[username])

  useEffect(() => {
    client.onopen = () => {
      console.log('WebSocket Client Connected');
    };
    client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data);
      if (dataFromServer.type === "userevent") {
        setCurrentUsers(Object.values(dataFromServer.data.users));
      } else if (dataFromServer.type === "contentchange") {
        setText(dataFromServer.data.editorContent || contentDefaultMessage)
      }
      setUserActivity(dataFromServer.data.userActivity)
    };
  },[])
  const showEditorSection = () => (
    <div className="main-content">
      <div className="document-holder">
        <div className="currentusers">
          {currentUsers.map(user => (
            <React.Fragment>
              <span id={user.username} className="userInfo" key={user.username}>
                <Identicon className="account__avatar" style={{ backgroundColor: user.randomcolor }} size={40} string={user.username} />
              </span>
              <UncontrolledTooltip placement="top" target={user.username}>
                {user.username}
              </UncontrolledTooltip>
            </React.Fragment>
          ))}
        </div>
        <Editor
          options={{
            placeholder: {
              text: text ? contentDefaultMessage : ""
            }
          }}
          className="body-editor"
          text={text}
          onChange={onEditorStateChange}
        />
      </div>
      <div className="history-holder">
        <ul>
          {userActivity.map((activity, index) => <li key={`activity-${index}`}>{activity}</li>)}
        </ul>
      </div>
    </div>
  )

  const showLoginSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">Hello, user!</p>
            <p className="account__sub">Join to edit the document</p>
          </div>
          <input name="username" onChange={(e) => setUser(e.target.value)} className="form-control" />
          <button type="button" onClick={logInUser} className="btn btn-primary account__btn">Join</button>
        </div>
      </div>
    </div>
  )
  return (
    <React.Fragment>
      <Navbar color="light" light>
        <NavbarBrand href="/">Real-time document editor</NavbarBrand>
      </Navbar>
      <div className="container-fluid">
        {username ? showEditorSection() : showLoginSection()}
      </div>
    </React.Fragment>
  )
}

export default App;