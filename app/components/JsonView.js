import ReactJson from 'react-json-view';

export default function JsonView(props){
  return (
    <ReactJson
      style={{ fontSize: 13, wordBreak: 'break-word' }}
      src={props.src}
      quotesOnKeys={false}
      enableAdd={false}
      enableEdit={false}
      enableDelete={false}
      collapsed={props.collapsed}
      name={false}
      theme="harmonic"
    />
  );
}