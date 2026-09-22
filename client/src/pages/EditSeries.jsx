import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SeriesForm from '../components/SeriesForm';
import { apiFetch } from '../utils/format';

export default function EditSeries() {
  const { slug } = useParams();
  const [series, setSeries] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/api/series/${slug}`)
      .then(setSeries)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className='p-10 text-center text-red-300'>{error}</p>;
  if (!series) return <p className='p-10 text-center text-gray-400'>Loading…</p>;
  return <SeriesForm series={series} />;
}
