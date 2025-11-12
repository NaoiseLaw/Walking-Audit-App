import { routeService } from './route.service';
import { prisma } from '../config/database.config';

jest.mock('../config/database.config');

describe('RouteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a route successfully', async () => {
      const mockRoute = {
        id: 'route-1',
        name: 'Test Route',
        townCity: 'Dublin',
        county: 'Dublin',
      };

      (prisma.route.create as jest.Mock).mockResolvedValue(mockRoute);

      const result = await routeService.create('user-1', {
        name: 'Test Route',
        townCity: 'Dublin',
        county: 'Dublin',
        geometry: 'LINESTRING(-6.2603 53.3498, -6.2604 53.3499)',
      });

      expect(result).toEqual(mockRoute);
      expect(prisma.route.create).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should get route by ID', async () => {
      const mockRoute = {
        id: 'route-1',
        name: 'Test Route',
      };

      (prisma.route.findUnique as jest.Mock).mockResolvedValue(mockRoute);

      const result = await routeService.getById('route-1');

      expect(result).toEqual(mockRoute);
    });

    it('should throw error if route not found', async () => {
      (prisma.route.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(routeService.getById('invalid-route')).rejects.toThrow('Route not found');
    });
  });
});

