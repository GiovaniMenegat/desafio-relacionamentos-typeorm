import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    try {
      const findProducts = await this.ormRepository.findByIds(products);
      return findProducts;
    } catch (error) {
      throw new AppError('Product not found');
    }
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const findProducts = await this.findAllById(products);
    findProducts.forEach(product => {
      products.forEach(dbProducts => {
        if (product.id === dbProducts.id) {
          product.quantity -= dbProducts.quantity;
          if (product.quantity <= 0) {
            throw new AppError(`Product ${product.name} out of stock`);
          }
        }
      });
    });

    return this.ormRepository.save(findProducts);
  }
}

export default ProductsRepository;
