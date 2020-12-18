import React from "react";
import graphql from "babel-plugin-relay/macro";
import { createFragmentContainer, QueryRenderer } from "react-relay";
import { commitMutation, Environment } from "relay-runtime";
import classnames from "classnames";
import type { TodoApplication_TodosQuery } from "./__generated__/TodoApplication_TodosQuery.graphql";
import type { TodoApplication_data } from "./__generated__/TodoApplication_data.graphql";
import type { TodoApplication_todo } from "./__generated__/TodoApplication_todo.graphql";

const TodoApplication_TodoDeleteMutation = graphql`
  mutation TodoApplication_TodoDeleteMutation($id: ID!) {
    todoDelete(id: $id) {
      __typename
    }
  }
`;

const TodoApplication_TodoChangeContentMutation = graphql`
  mutation TodoApplication_TodoChangeContentMutation(
    $id: ID!
    $content: String!
  ) {
    todoChangeContent(id: $id, content: $content) {
      __typename
    }
  }
`;

const TodoApplication_TodoToggleIsCompletedMutation = graphql`
  mutation TodoApplication_TodoToggleIsCompletedMutation($id: ID!) {
    todoToggleIsCompleted(id: $id) {
      __typename
    }
  }
`;

const TodoRenderer = (props: {
  todo: TodoApplication_todo;
  environment: Environment;
}): React.ReactElement => {
  const [isEditing, setIsEditing] = React.useState(false);
  const handleDestroyClick = () => {
    commitMutation(props.environment, {
      mutation: TodoApplication_TodoDeleteMutation,
      variables: {
        id: props.todo.id,
      },
    });
  };
  const handleTextInputSave = (content: string) => {
    setIsEditing(false);
    commitMutation(props.environment, {
      mutation: TodoApplication_TodoChangeContentMutation,
      variables: {
        id: props.todo.id,
        content,
      },
    });
  };

  const handleLabelDoubleClick = () => setIsEditing(true);
  const handleTextInputCancel = () => setIsEditing(false);

  const handleTextInputDelete = () => {
    setIsEditing(false);
    handleDestroyClick();
  };

  const handleToggleComplete = () => {
    commitMutation(props.environment, {
      mutation: TodoApplication_TodoToggleIsCompletedMutation,
      variables: {
        id: props.todo.id,
      },
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

const Todo = createFragmentContainer(TodoRenderer, {
  todo: graphql`
    fragment TodoApplication_todo on Todo {
      id
      content
      isCompleted
    }
  `,
});

const TodoListRenderer = (props: {
  data: TodoApplication_data;
  environment: Environment;
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
          <Todo key={todo.id} todo={todo} environment={props.environment} />
        ))}
      </ul>
    </section>
  );
};

const TodoList = createFragmentContainer(TodoListRenderer, {
  data: graphql`
    fragment TodoApplication_data on Query {
      todos {
        id
        ...TodoApplication_todo
      }
    }
  `,
});

const TodosQuery = graphql`
  query TodoApplication_TodosQuery @live {
    ...TodoApplication_data
  }
`;

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

const TodoApplication_TodoAddMutation = graphql`
  mutation TodoApplication_TodoAddMutation($id: ID!, $content: String!) {
    todoAdd(id: $id, content: $content) {
      __typename
    }
  }
`;

const randomId = () => {
  const uint32 = window.crypto.getRandomValues(new Uint32Array(1))[0];
  return uint32.toString(16);
};

export const TodoApplication = (props: {
  environment: Environment;
}): React.ReactElement => {
  const handleTextInputSave = (content: string) => {
    commitMutation(props.environment, {
      mutation: TodoApplication_TodoAddMutation,
      variables: {
        id: randomId(),
        content,
      },
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

        <QueryRenderer<TodoApplication_TodosQuery>
          environment={props.environment}
          query={TodosQuery}
          variables={{}}
          render={(renderProps) => {
            if (renderProps.error) {
              return <div>Unexpected Error occured.</div>;
            }
            if (renderProps.props) {
              return (
                <TodoList
                  data={renderProps.props}
                  environment={props.environment}
                />
              );
            }
            return <div>Loading...</div>;
          }}
        />
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
          <a href="https://github.com/n1ru4l/graphql-live-query/tree/main/packages/todo-example/client-relay">
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
