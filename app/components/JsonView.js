import ReactJson from 'react-json-view';

export default function JsonView({ src, collapsed }){
  return (
    <ReactJson
      style={{ fontSize: 13, wordBreak: 'break-word' }}
      src={src}
      quotesOnKeys={false}
      enableAdd={false}
      enableEdit={false}
      enableDelete={false}
      collapsed={collapsed}
      name={false}
      theme="harmonic"
    />
  );
}