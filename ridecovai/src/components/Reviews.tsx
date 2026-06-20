'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  user_id: string;
  vehicle_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: { full_name: string };
}

interface ReviewsProps {
  vehicleId: string;
}

export default function Reviews({ vehicleId }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [vehicleId]);

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select(`
        id, user_id, vehicle_id, rating, comment, created_at,
        profiles (full_name)
      `)
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false });

    if (data) setReviews(data as Review[]);
    setLoading(false);
  }

  async function submitReview() {
    if (newRating === 0) return;
    
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('Please login to write a review');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      rating: newRating,
      comment: newComment,
    });

    if (!error) {
      setNewRating(0);
      setNewComment('');
      fetchReviews();
    }
    setSubmitting(false);
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  if (loading) return <div className="text-gray-400">Loading reviews...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold">{averageRating}</div>
            <div className="flex gap-1 my-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  className={`w-5 h-5 ${
                    star <= Math.round(parseFloat(averageRating)) 
                      ? 'text-amber-400 fill-amber-400' 
                      : 'text-gray-600'
                  }`} 
                />
              ))}
            </div>
            <p className="text-sm text-gray-400">{reviews.length} reviews</p>
          </div>
          
          <div className="flex-1 space-y-2">
            {ratingCounts.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-8">{stars}★</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Write a Review</h3>
        
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setNewRating(star)}
              className="transition-transform hover:scale-110 cursor-pointer"
            >
              <Star 
                className={`w-8 h-8 ${
                  star <= (hoveredStar || newRating) 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-gray-600'
                }`} 
              />
            </button>
          ))}
        </div>
        
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your experience with this car..."
          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none resize-none h-24 mb-4"
        />
        
        <button
          onClick={submitReview}
          disabled={submitting || newRating === 0}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg font-medium transition-colors cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">{review.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(review.created_at).toLocaleDateString('en-IN', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      star <= review.rating 
                        ? 'text-amber-400 fill-amber-400' 
                        : 'text-gray-600'
                    }`} 
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-300">{review.comment}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
