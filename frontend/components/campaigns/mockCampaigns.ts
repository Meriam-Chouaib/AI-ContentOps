import { AiGeneration } from "./types";

export const mockCampaigns: AiGeneration[] = [
  {
    id: 'mock-001',
    subjectId: 'sub-mock-001',
    userId: 'usr-mock',
    subject: 'Introduction to Machine Learning',
    status: 'completed',
    generatedContent: `# Introduction to Machine Learning

Machine Learning (ML) is a branch of Artificial Intelligence (AI) that enables systems to learn from data and improve from experience without being explicitly programmed.

## Core Concepts

### Supervised Learning
In supervised learning, the algorithm is trained on a labeled dataset. Each training example is paired with an output label. The algorithm learns to map inputs to outputs.

**Examples:**
- Email spam classification
- House price prediction
- Medical diagnosis

### Unsupervised Learning
Here, the algorithm discovers hidden patterns in data without any labeled responses. It's about finding structure in unlabeled data.

**Examples:**
- Customer segmentation
- Anomaly detection
- Dimensionality reduction

### Reinforcement Learning
An agent learns to behave in an environment by performing actions and observing the rewards or penalties.

## Why Machine Learning Matters

Machine learning is transforming industries:
- **Healthcare:** Early disease detection
- **Finance:** Fraud detection
- **Education:** Personalized learning paths
- **Marketing:** Targeted campaigns

## Getting Started

To begin with ML, you should understand statistics, linear algebra, and Python programming. Popular libraries include TensorFlow, PyTorch, and Scikit-learn.`,
    errorMessage: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-002',
    subjectId: 'sub-mock-002',
    userId: 'usr-mock',
    subject: 'The Role of APIs in Modern Web Development',
    status: 'completed',
    generatedContent: `# The Role of APIs in Modern Web Development

An API (Application Programming Interface) is a set of protocols and tools that allows different software applications to communicate with each other.

## What is an API?

Think of an API as a waiter in a restaurant. You (the client) place an order (request), the waiter (API) takes it to the kitchen (server), and brings back your food (response).

## Types of APIs

### REST APIs
REST (Representational State Transfer) APIs are the most common. They use HTTP methods:
- **GET** — Retrieve data
- **POST** — Create new data
- **PUT/PATCH** — Update existing data
- **DELETE** — Remove data

### GraphQL APIs
GraphQL allows clients to request exactly the data they need, nothing more, nothing less. This reduces over-fetching and under-fetching of data.

## Why APIs are Essential

1. **Separation of concerns** — Frontend and backend can evolve independently
2. **Reusability** — One API can serve web, mobile, and third-party clients
3. **Scalability** — Microservices architecture relies on APIs
4. **Integration** — Connect third-party services easily (payments, auth, etc.)

## Best Practices

- Use meaningful HTTP status codes
- Version your APIs (e.g., /api/v1/)
- Implement proper authentication (JWT, OAuth)
- Document with OpenAPI/Swagger
- Rate limit to prevent abuse`,
    errorMessage: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-003',
    subjectId: 'sub-mock-003',
    userId: 'usr-mock',
    subject: 'Understanding Docker and Containerization',
    status: 'pending',
    generatedContent: null,
    errorMessage: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-004',
    subjectId: 'sub-mock-004',
    userId: 'usr-mock',
    subject: 'Advanced TypeScript Patterns for Enterprise Apps',
    status: 'failed',
    generatedContent: null,
    errorMessage: 'OpenAI API quota exceeded',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
]
