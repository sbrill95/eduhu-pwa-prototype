# Tavily API Documentation Summary

## Overview
Tavily provides a web search API that returns relevant results, LLM-generated answers, images, and more. It is designed for real-time, high-quality search integration in applications.

## Authentication
- All requests require an API key in the `Authorization` header:
  - `Authorization: Bearer tvly-YOUR_API_KEY`

## Endpoint
- **POST** `/search`
- **Base URL:** `https://api.tavily.com/search`

## Request Body (application/json)
- `query` (string, required): The search query.
- `auto_parameters` (boolean, default: false): Auto-configure search parameters.
- `topic` (enum, default: general): `general`, `news`, `finance`.
- `search_depth` (enum, default: basic): `basic` (1 credit), `advanced` (2 credits).
- `chunks_per_source` (int, default: 3): Max 3, only for `advanced`.
- `max_results` (int, default: 5): 0-20.
- `time_range` (enum): `day`, `week`, `month`, `year`.
- `days` (int, default: 7): Only for `news`.
- `start_date`, `end_date` (YYYY-MM-DD): Filter by publish date.
- `include_answer` (bool): Include LLM-generated answer.
- `include_raw_content` (bool): Include cleaned HTML/text content.
- `include_images` (bool): Include image search results.
- `include_image_descriptions` (bool): Add descriptions to images.
- `include_favicon` (bool): Include favicon URL.
- `include_domains`, `exclude_domains` (string[]): Domains to include/exclude.
- `country` (enum): Boost results from a specific country.

## Example Request
```json
{
  "query": "Who is Leo Messi?",
  "include_answer": true,
  "max_results": 3
}
```

## Example cURL
```
curl -X POST "https://api.tavily.com/search" \
  -H "Authorization: Bearer tvly-YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "Who is Leo Messi?", "include_answer": true, "max_results": 3}'
```

## Example Response
```json
{
  "query": "Who is Leo Messi?",
  "answer": "Lionel Messi, born in 1987, is an Argentine footballer widely regarded as one of the greatest players of his generation...",
  "images": [],
  "results": [
    {
      "title": "Lionel Messi Facts | Britannica",
      "url": "https://www.britannica.com/facts/Lionel-Messi",
      "content": "Lionel Messi, an Argentine footballer, is widely regarded as one of the greatest football players...",
      "score": 0.81,
      "raw_content": null,
      "favicon": "https://britannica.com/favicon.png"
    }
  ],
  "auto_parameters": {"topic": "general", "search_depth": "basic"},
  "response_time": "1.67",
  "request_id": "123e4567-e89b-12d3-a456-426614174111"
}
```

## Rate Limits
- Rate limits depend on your plan and are documented at: https://docs.tavily.com/documentation/rate-limits

## Credits
- Each request consumes API credits. Advanced search and some features cost more credits.

## References
- [Tavily Docs](https://docs.tavily.com/)
- [API Reference](https://docs.tavily.com/documentation/api-reference/endpoint/search)
- [Quickstart](https://docs.tavily.com/documentation/quickstart)

*This summary covers authentication, endpoints, request/response structure, and usage for the Tavily API. For advanced options and updates, refer to the official documentation links above.*
