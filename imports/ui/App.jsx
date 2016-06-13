import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom'
import { Meteor } from 'meteor/meteor'
import { createContainer } from 'meteor/react-meteor-data';

import { Tasks } from '../api/tasks.js';
 
import Task from './Task.jsx';
import AccountsUIWrapper from './AccountsUIWrapper.jsx';
 
// App component - represents the whole app
class App extends Component {

  constructor(props) {
    super(props);

    this.state = {  // ALLOWS US TO USE THIS.SETSTATE() DOWN BELOW IN EVENT HANDLER
      hideCompleted: false,
      onlyMine: false,
    };
  }
  handleSubmit(event) {
    event.preventDefault();

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();  // NOTE textInput

    Meteor.call('tasks.insert', text, () => {
      ReactDOM.findDOMNode(this.refs.textInput).value = '';
    });
  }
  toggleHideCompleted() {
    this.setState({
      hideCompleted: !this.state.hideCompleted,
    });
  }
  toggleOnlyMine() {
    this.setState({
      onlyMine: !this.state.onlyMine,
    });
  }
  renderTasks() {
    let filteredTasks = this.props.tasks;
    if (this.state.hideCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.checked);
    }
    if (this.state.onlyMine) {
      filteredTasks = filteredTasks.filter(task => task.username === 
        this.props.currentUser.username);
    }
    return filteredTasks.map((task) => {
      const currentUserId = this.props.currentUser && this.props.currentUser._id;
      const showPrivateButton = task.owner === currentUserId;

      return (
        <Task
          key={task._id}
          task={task}
          showPrivateButton={showPrivateButton}
        />
      );
    });
  } 
  render() {
    return (
      <div className="container">
        <header>
          <h1>Todo List ({this.props.incompleteCount})</h1>

          <label className="hide-completed">
            <input
              type="checkbox"
              readOnly
              checked={this.state.onlyMine}
              onClick={this.toggleOnlyMine.bind(this)}
            />
            Show Only Mine
          </label>
          <label className="hide-completed">
            <input 
              type="checkbox"
              readOnly
              checked={this.state.hideCompleted}    // STATE VARIABLE USAGE HERE
              onClick={this.toggleHideCompleted.bind(this)}
            />
            Hide Completed Tasks
          </label>

          <AccountsUIWrapper />

          {this.props.currentUser ? 
            <form className="new-task" onSubmit={this.handleSubmit.bind(this)} >
              <input
                type="test"
                ref="textInput"
                placeholder="Type to add new tasks"
              />
            </form> : ''
          }
        </header>
 
        <ul>
          {this.renderTasks()}
        </ul>
      </div>
    );
  }
}

App.propTypes = { // DON'T FORGET ABOUT THESE
  tasks: PropTypes.array.isRequired,
  incompleteCount: PropTypes.number.isRequired,
  currentUser: PropTypes.object,
};

export default createContainer(() => {
  Meteor.subscribe('tasks');

  return {
    tasks: Tasks.find({}, { sort: { createdAt: -1 } }).fetch(), // puts newer things at top
    incompleteCount: Tasks.find({ checked: { $ne: true } }).count(),
    currentUser: Meteor.user(),
  };
}, App);
// The wrapped App component fetches tasks from the Tasks collection via the container, 
// supplies them to App component it wraps through the three props
