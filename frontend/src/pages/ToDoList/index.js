import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import { toast } from 'react-toastify';
import { i18n } from '../../translate/i18n';
import MainContainer from '../../components/MainContainer';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '2rem'
  },
  inputContainer: {
    display: 'flex',
    width: '100%',
    marginBottom: '1rem'
  },
  input: {
    flexGrow: 1,
    marginRight: '1rem'
  },
  listContainer: {
    width: '100%',
    height: '100%',
    marginTop: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '5px',
  },
  list: {
    marginBottom: '5px'
  }
});

const ToDoList = () => {
  const classes = useStyles();

  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [editIndex, setEditIndex] = useState(-1);

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
        }
      }
    } catch (e) {
      // Ignora dados corrompidos do localStorage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTaskChange = (event) => {
    setTask(event.target.value);
  };

  const handleAddTask = () => {
    const taskText = (task || '').toString().trim();
    if (!taskText) {
      toast.info(i18n.t('todolist.buttons.typeTask', 'Digite uma tarefa para adicionar'));
      return;
    }

    const now = new Date();
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    if (editIndex >= 0) {
      // Editar tarefa existente
      const newTasks = [...tasksArray];
      const existing = newTasks[editIndex];
      newTasks[editIndex] = {
        text: taskText,
        updatedAt: now,
        createdAt: existing?.createdAt ? new Date(existing.createdAt) : now,
      };
      setTasks(newTasks);
      setTask('');
      setEditIndex(-1);
    } else {
      // Adicionar nova tarefa
      setTasks([...tasksArray, { text: taskText, createdAt: now, updatedAt: now }]);
      setTask('');
    }
  };

  const handleEditTask = (index) => {
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    const taskItem = tasksArray[index];
    setTask((taskItem?.text || '').toString());
    setEditIndex(index);
  };

  const handleDeleteTask = (index) => {
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    const newTasks = [...tasksArray];
    newTasks.splice(index, 1);
    setTasks(newTasks);
  };

  return (
    <MainContainer>
    <div className={classes.root}>
      <div className={classes.inputContainer}>
        <TextField
          className={classes.input}
          label={i18n.t('todolist.input')}
          value={task}
          onChange={handleTaskChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTask();
            }
          }}
          variant="outlined"
        />
        <Button type="button" variant="contained" color="primary" onClick={handleAddTask}>
          {editIndex >= 0 ? i18n.t('todolist.buttons.save') : i18n.t('todolist.buttons.add')}
        </Button>
      </div>
      <div className={classes.listContainer}>
        <List>
          {(Array.isArray(tasks) ? tasks : []).map((taskItem, index) => (
            <ListItem key={index} className={classes.list}>
              <ListItemText
                primary={taskItem?.text || ''}
                secondary={
                  taskItem?.updatedAt
                    ? new Date(taskItem.updatedAt).toLocaleString()
                    : taskItem?.createdAt
                    ? new Date(taskItem.createdAt).toLocaleString()
                    : ''
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => handleEditTask(index)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteTask(index)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </div>
    </div>
    </MainContainer>
  );
};


export default ToDoList;
