import { useState } from 'react';
const Home = () => {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [message, setMessage] = useState('');
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!sitemapUrl) return;
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation SaveSitemapUrl($url: String!) {
              saveSitemapUrl(url: $url)
            }
          `,
          variables: { url: sitemapUrl },
        }),
      });
      const result = await response.json();
      console.log('Full response:', result);

      if (result.errors) {
        setMessage(result.errors[0].message);
        console.error('Error from GraphQL:', result.errors);
      } else {
        setMessage(result.data.saveSitemapUrl);
        console.log('Sitemap URL saved:', result.data.saveSitemapUrl);
        const crawlResult = await triggerCrawl(sitemapUrl);
        // Extract class name from response
        if (crawlResult) {
          console.log(crawlResult,'crawlResult')
          const match = crawlResult.match(/Class name: (\w+)/);
          if (match) {
            const className = match[1];
            // Navigate to the chatbot page after crawling and indexing are complete
            setTimeout(() => {
              window.location.href = `http://localhost:7860?className=${className}`;
            }, 5000);
          }
        }
      }
    } catch (error) {
      setMessage('Error saving sitemap URL.');
      console.error('Error:', error);
    }
  };

  const triggerCrawl = async (url: string) => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation CrawlSitemap($url: String!) {
              crawlSitemap(url: $url)
            }
          `,
          variables: { url },
        }),
      });
      const result = await response.json();
      console.log('Crawl response:', result);

      if (result.errors) {
        setMessage(result.errors[0].message);
        console.error('Error from GraphQL:', result.errors);
        return
      } else {
        setMessage(result.data.crawlSitemap);
        console.log('Crawl completed:', result.data.crawlSitemap + " Your chatbot is ready.");
        return result.data.crawlSitemap
      }
    } catch (error) {
      setMessage('Error triggering crawl.');
      console.error('Error:', error);
      return
    }
  };

  return (
    <div style={{
      margin:300
    }}>
      <h1>Submit Sitemap URL</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={sitemapUrl}
          onChange={(e) => setSitemapUrl(e.target.value)}
          placeholder="Enter sitemap URL"
          required
        />
        <button style={{
            padding: '10px 20px',
            margin:'10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
         type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Home;