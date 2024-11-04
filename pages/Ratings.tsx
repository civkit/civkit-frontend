import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaStarHalf } from 'react-icons/fa';

interface Rating {
  rating: number;
  remarks: string;
  created_at: string;
  rated_by_username: string;
}

interface UserRating {
  id: number;
  username: string;
  created_at: string;
  total_ratings: number;
  average_rating: number | null;
  ratings: Rating[];
}

const Ratings: React.FC = () => {
  const [users, setUsers] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/ratings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUsers(response.data);
      } catch (error) {
        setError('Failed to fetch ratings');
        console.error('Error fetching ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  const renderStars = (rating: number | null) => {
    if (rating === null) return 'No ratings yet';

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-500" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalf key="half" className="text-yellow-500" />);
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">
        User Ratings
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead>
            <tr className="text-gray-700 dark:text-gray-200">
              <th className="border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700">
                Username
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700">
                Average Rating
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700">
                Total Ratings
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-left dark:border-gray-700">
                Member Since
              </th>
              <th className="border-b border-gray-200 px-4 py-2 text-center dark:border-gray-700">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {users.filter(user => user.total_ratings > 0).map((user) => (
              <React.Fragment key={user.id}>
                <tr className="odd:bg-gray-100 even:bg-white dark:odd:bg-gray-700 dark:even:bg-gray-800">
                  <td className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    {user.username}
                  </td>
                  <td className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    {renderStars(user.average_rating)}
                  </td>
                  <td className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    {user.total_ratings}
                  </td>
                  <td className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="border-b border-gray-200 px-4 py-2 text-center dark:border-gray-700">
                    <button
                      onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                      className="rounded bg-orange-500 px-3 py-1 text-white hover:bg-orange-600"
                    >
                      {expandedUser === user.id ? 'Hide' : 'Show'} Reviews
                    </button>
                  </td>
                </tr>
                {expandedUser === user.id && (
                  <tr>
                    <td colSpan={5} className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                      <div className="space-y-2">
                        {user.ratings.map((rating, index) => (
                          <div
                            key={index}
                            className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {renderStars(rating.rating)}
                                <span className="text-sm text-gray-500">
                                  {new Date(rating.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                Rated by: {rating.rated_by_username}
                              </div>
                            </div>
                            {rating.remarks && (
                              <p className="mt-1 text-gray-600 dark:text-gray-300">
                                "{rating.remarks}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ratings;