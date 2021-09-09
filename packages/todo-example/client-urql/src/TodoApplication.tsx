import * as React from "react";
import classnames from "classnames";
import { gql, DocumentType } from "./gql";
import { useMutation, useQuery } from "urql";

const TodoApplication_TodoFragment = gql(/* GraphQL */ `
  fragment TodoApplication_todo on Todo {
    id
    content
    isCompleted
  }
`);

const TodoApplication_TodoChangeContentMutation = gql(/* GraphQL */ `
  mutation TodoApplication_TodoChangeContentMutation(
    $id: ID!
    $content: String!
  ) {
    todoChangeContent(id: $id, content: $content) {
      __typename
    }
  }
`);

const TodoApplication_TodoDeleteMutation = gql(/* GraphQL */ `
  mutation TodoApplication_TodoDeleteMutation($id: ID!) {
    todoDelete(id: $id) {
      __typename
    }
  }
`);

const TodoApplication_TodoToggleIsCompletedMutation = gql(/* GraphQL */ `
  mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {
    todoToggleIsCompleted(id: $id) {
      __typename
    }
  }
`);

const TodoRenderer = (props: {
  todo: DocumentType<typeof TodoApplication_TodoFragment>;
}): React.ReactElement => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [, deleteTodo] = useMutation(TodoApplication_TodoDeleteMutation);
  const [, changeTodo] = useMutation(TodoApplication_TodoChangeContentMutation);
  const [, toggleIsComplete] = useMutation(
    TodoApplication_TodoToggleIsCompletedMutation
  );
  const handleDestroyClick = () => {
    deleteTodo({
      id: props.todo.id,
    });
  };
  const handleTextInputSave = (content: string) => {
    setIsEditing(false);
    changeTodo({
      id: props.todo.id,
      content,
    });
  };

  const handleLabelDoubleClick = () => setIsEditing(true);
  const handleTextInputCancel = () => setIsEditing(false);

  const handleTextInputDelete = () => {
    setIsEditing(false);
    handleDestroyClick();
  };

  const handleToggleComplete = () => {
    toggleIsComplete({
      id: props.todo.id,
    });
  };

  return (
    <li
      className={classnames({
        completed: props.todo.isCompleted,
        editing: isEditing,
      })}
    >
      <div className="view">
        <input
          checked={props.todo.isCompleted}
          className="toggle"
          onChange={handleToggleComplete}
          type="checkbox"
        />

        <label onDoubleClick={handleLabelDoubleClick}>
          {props.todo.content}
        </label>
        <button className="destroy" onClick={handleDestroyClick} />
      </div>

      {isEditing && (
        <TodoTextInput
          className="edit"
          commitOnBlur={true}
          initialValue={props.todo.content}
          onCancel={handleTextInputCancel}
          onDelete={handleTextInputDelete}
          onSave={handleTextInputSave}
        />
      )}
    </li>
  );
};

const Todo = TodoRenderer;

const TodoApplication_DataFragment = gql(/* GraphQL */ `
  fragment TodoApplication_data on Query {
    todos {
      id
      ...TodoApplication_todo
    }
  }
`);

const TodoListRenderer = (props: {
  data: DocumentType<typeof TodoApplication_DataFragment>;
}): React.ReactElement => {
  return (
    <section className="main">
      {/* <input
        checked={totalCount === completedCount}
        className="toggle-all"
        onChange={handleMarkAllChange}
        type="checkbox"
      /> */}

      {/* <label htmlFor="toggle-all">Mark all as complete</label> */}

      <ul className="todo-list">
        {props.data.todos.map((todo) => (
          <Todo key={todo.id} todo={todo} />
        ))}
      </ul>
    </section>
  );
};

const TodoList = TodoListRenderer;

const ENTER_KEY_CODE = 13;
const ESC_KEY_CODE = 27;

const TodoTextInput = ({
  className,
  commitOnBlur,
  initialValue,
  onCancel,
  onDelete,
  onSave,
  placeholder,
}: {
  className: string;
  commitOnBlur?: boolean;
  initialValue?: string;
  onCancel?: () => void;
  onDelete?: () => void;
  onSave: (value: string) => void;
  placeholder?: string;
}): React.ReactElement => {
  const [text, setText] = React.useState<string>(initialValue || "");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const commitChanges = () => {
    const newText = text.trim();

    if (onDelete && newText === "") {
      onDelete();
    } else if (onCancel && newText === initialValue) {
      onCancel();
    } else if (newText !== "") {
      onSave(newText);
      setText("");
    }
  };

  const handleBlur = () => {
    if (commitOnBlur) {
      commitChanges();
    }
  };

  const handleChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setText(e.currentTarget.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onCancel && e.keyCode === ESC_KEY_CODE) {
      onCancel();
    } else if (e.keyCode === ENTER_KEY_CODE) {
      commitChanges();
    }
  };

  return (
    <input
      className={className}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      ref={inputRef}
      value={text}
    />
  );
};

const randomId = () => {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return uint32.toString(16);
};

const TodoApplication_TodosQuery = gql(/* GraphQL */ `
  query TodoApplication_TodosQuery @live {
    ...TodoApplication_data
  }
`);

const TodoApplication_TodoAddMutation = gql(/* GraphQL */ `
  mutation TodoApplication_TodoAddMutation($id: ID!, $content: String!) {
    todoAdd(id: $id, content: $content) {
      __typename
    }
  }
`);

export const TodoApplication = (): React.ReactElement => {
  const [result] = useQuery({ query: TodoApplication_TodosQuery });
  const [, addTodo] = useMutation(TodoApplication_TodoAddMutation);
  const handleTextInputSave = (content: string) => {
    addTodo({
      id: randomId(),
      content,
    });
  };

  return (
    <div>
      <section className="todoapp">
        <header className="header">
          <h1>todos</h1>

          <TodoTextInput
            className="new-todo"
            onSave={handleTextInputSave}
            placeholder="What needs to be done?"
          />
        </header>
        {result.error ? <div>Unexpected Error occured.</div> : null}
        {result.data ? <TodoList data={result.data} /> : null}
        {/* {hasTodos && <TodoListFooter user={user} />} */}
      </section>

      <footer className="info">
        <p>Double-click to edit a todo</p>

        <p>
          Frontend created by{" "}
          <a href="https://github.com/n1ru4l">Laurin Quast</a>
        </p>
        <p>
          Backend created by{" "}
          <a href="https://github.com/n1ru4l/graphql-live-query/tree/main/packages/server">
            Laurin Quast
          </a>
        </p>
        <p>
          <a href="https://github.com/n1ru4l/graphql-live-query/tree/main/packages/todo-example/client-urql">
            Show Source Code on GitHub
          </a>
        </p>

        <p>
          Part of <a href="http://todomvc.com">TodoMVC</a>
        </p>
      </footer>
    </div>
  );
};
