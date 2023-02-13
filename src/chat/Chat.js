// Note: We can probably make this a reusable component to use for both
// the user & agent.
import './Chat.css';

const SOME_VAR = "Chat Page";

function Chat() {
  return (
    <div>
      <h1>{SOME_VAR}</h1>
    </div>
  );
}

export default Chat;