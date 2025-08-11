import PropTypes from 'prop-types';

export default function ReasoningPart({ part }) {
  return <div style={{ fontStyle: 'italic', color: 'grey' }}>{part.text}</div>;
}

ReasoningPart.propTypes = {
  part: PropTypes.shape({
    text: PropTypes.string.isRequired,
  }).isRequired,
};
