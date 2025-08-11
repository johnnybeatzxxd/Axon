import PropTypes from 'prop-types';

export default function TextPart({ part }) {
  return <div>{part.text}</div>;
}

TextPart.propTypes = {
  part: PropTypes.shape({
    text: PropTypes.string.isRequired,
  }).isRequired,
};
