import { memo } from 'react';
import { JsonViewer } from '@textea/json-viewer';

const harmonic = { scheme: 'harmonic16', author: 'jannik siebert (https://github.com/janniks)',
                   base00: '#0b1c2c', base01: '#223b54', base02: '#405c79', base03: '#627e99',
                   base04: '#aabcce', base05: '#cbd6e2', base06: '#e5ebf1', base07: '#f7f9fb',
                   base08: '#bf8b56', base09: '#bfbf56', base0A: '#8bbf56', base0B: '#56bf8b',
                   base0C: '#568bbf', base0D: '#8b56bf', base0E: '#bf568b', base0F: '#bf5656' };

function JsonView({ src, collapsed }){
  return (
    <JsonViewer
      value={src}
      style={{ fontSize: 14 }}
      rootName={false}
      indentWidth={4}
      defaultInspectDepth={collapsed}
      maxDisplayLength={50}
      collapseStringsAfterLength={200}
      quotesOnKeys={false}
      theme={harmonic}
    />
  );
}

export default memo(JsonView);