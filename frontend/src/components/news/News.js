import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../App';
import { AuthContext } from '../../AuthContext/AuthContext';
import './News.css';

const News = () => {
    const { user } = useContext(AuthContext);
    const [newsMode, setNewsMode] = useState('global');
    const [newsArticles, setNewsArticles] = useState([]);
    const [articlesToShow, setArticlesToShow] = useState(3); // Number of articles to display
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchNews = async () => {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth-token');
        if (!token) {
            setError('Authorization token is missing');
            return;
        }

        const targetCount = 15; // Fetch up to 15 articles
        const largeLimit = 30; // Fetch more to ensure uniqueness
        let uniqueArticles = [];
        const titles = new Set();
        let attempts = 3;

        const getArticlesBatch = async () => {
            const countryParam = newsMode === 'local' && user?.Country ? `&country=${user.Country}` : '';
            const searchParam = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : '';
            const url = `${API_BASE_URL}/api/news?mode=${newsMode}${countryParam}${searchParam}&limit=${largeLimit}`;
            
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.data;
        };

        try {
            while (uniqueArticles.length < targetCount && attempts > 0) {
                const articles = await getArticlesBatch();

                articles.forEach((article) => {
                    if (!titles.has(article.title) && uniqueArticles.length < targetCount) {
                        titles.add(article.title);
                        uniqueArticles.push(article);
                    }
                });
                attempts--;
            }

            setNewsArticles(uniqueArticles);
            setArticlesToShow(3); // Reset the displayed articles count
            if (uniqueArticles.length === 0) {
                setError(`No news articles found${searchTerm ? ` for "${searchTerm}"` : ""}.`);
            }
        } catch (err) {
            setError("Failed to fetch news. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };    

    const handleSearch = (e) => {
        e.preventDefault();
        fetchNews();
    };

    useEffect(() => {
        fetchNews();
    }, [newsMode, user?.Country]);

    return (
        <div className="news-container">
            <div className="news-mode-buttons">
                <button onClick={() => setNewsMode('global')} disabled={newsMode === 'global'}>
                    Global News
                </button>
                <button onClick={() => setNewsMode('local')} disabled={newsMode === 'local'}>
                    Local News
                </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="news-search-form">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for news..."
                    className="news-search-input"
                />
                <button type="submit" className="news-search-button">Search</button>
            </form>

            {loading && <p className="loading">Loading news...</p>}
            {error && <p className="error">{error}</p>}

            <div className="news-articles-grid">
                {newsArticles.slice(0, articlesToShow).map((article, index) => (
                    <div key={index} className="news-article">
                        {article.image_url && (
                            <img src={article.image_url} alt="News" className="news-article-image" />
                        )}
                        <h2>{article.title}</h2>
                        <p>{article.description || article.content}</p>
                        {article.link && (
                            <a href={article.link} target="_blank" rel="noopener noreferrer">
                                Read more
                            </a>
                        )}
                    </div>
                ))}
            </div>

            {/* See More Button */}
            {articlesToShow < 15 && articlesToShow < newsArticles.length && (
                <button className="see-more-button" onClick={() => setArticlesToShow(articlesToShow + 3)}>
                    See More
                </button>
            )}
        </div>
    );
};

export default News;
