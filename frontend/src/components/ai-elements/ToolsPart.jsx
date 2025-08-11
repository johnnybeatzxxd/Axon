import PropTypes from 'prop-types';

export default function ToolsPart({ part }) {
  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
      <div><strong>Tool:</strong> {part.header.type}</div>
      <div><strong>State:</strong> {part.header.state}</div>
      <div><strong>Input:</strong> <pre>{JSON.stringify(part.input, null, 2)}</pre></div>
      {part.output && <div><strong>Output:</strong> <pre>{part.output}</pre></div>}
    </div>
  );
}

ToolsPart.propTypes = {
  part: PropTypes.shape({
    header: PropTypes.shape({
      type: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
    }).isRequired,
    input: PropTypes.object.isRequired,
    output: PropTypes.string,
  }).isRequired,
};
