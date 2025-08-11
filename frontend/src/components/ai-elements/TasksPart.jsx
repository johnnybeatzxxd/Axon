import PropTypes from 'prop-types';

export default function TasksPart({ part }) {
  return (
    <div>
      <strong>{part.title}</strong>
      <ul>
        {part.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

TasksPart.propTypes = {
  part: PropTypes.shape({
    title: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};
