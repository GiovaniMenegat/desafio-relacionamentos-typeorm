import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    let customer;
    try {
      customer = await this.customersRepository.findById(customer_id);
    } catch (error) {
      throw new AppError('Customer not found.');
    }

    const findProducts = await this.productsRepository.findAllById(products);

    if (findProducts.length === 0) {
      throw new AppError('You must send at least one product.');
    }

    const order = await this.ordersRepository.create({
      customer,
      products: products.map(({ id, quantity }) => ({
        product_id: id,
        price: findProducts.find(product => product.id === id)?.price || 0,
        quantity,
      })),
    });
    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
