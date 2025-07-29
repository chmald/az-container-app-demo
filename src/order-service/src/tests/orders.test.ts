import request from 'supertest';
import app from '../server';

describe('Order Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        service: 'order-service',
        status: 'healthy'
      });
    });
  });

  describe('GET /api/orders', () => {
    it('should return orders list', async () => {
      const response = await request(app)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const orderData = {
        customerId: 'customer-123',
        items: [
          {
            productId: 'product-001',
            quantity: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          customerId: orderData.customerId,
          items: expect.any(Array),
          status: 'pending'
        })
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Validation failed')
      });
    });
  });
});