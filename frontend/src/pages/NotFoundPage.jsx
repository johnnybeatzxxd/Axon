import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="page">
      <h1>404</h1>
      <p>We couldn’t find that page.</p>
      <Link to="/">Go home</Link>
    </section>
  )
}


