import { MedusaError } from "medusa-core-utils"
import { BaseService } from "medusa-interfaces"
import { DeepPartial, EntityManager } from "typeorm"
import { CustomerGroup } from ".."
import { CustomerGroupRepository } from "../repositories/customer-group"

type CustomerGroupConstructorProps = {
  manager: EntityManager
  customerGroupRepository: typeof CustomerGroupRepository
}
class CustomerGroupService extends BaseService {
  private manager_: EntityManager

  private customerGroupRepository_: typeof CustomerGroupRepository

  constructor({
    manager,
    customerGroupRepository,
  }: CustomerGroupConstructorProps) {
    super()

    this.manager_ = manager

    this.customerGroupRepository_ = customerGroupRepository
  }

  withTransaction(transactionManager: EntityManager): CustomerGroupService {
    if (!transactionManager) {
      return this
    }

    const cloned = new CustomerGroupService({
      manager: transactionManager,
      customerGroupRepository: this.customerGroupRepository_,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  async retrieve(id: string, config = {}): Promise<CustomerGroup> {
    const customerRepo = this.manager_.getCustomRepository(
      this.customerGroupRepository_
    )

    const validatedId = this.validateId_(id)
    const query = this.buildQuery_({ id: validatedId }, config)

    const customerGroup = await customerRepo.findOne(query)
    if (!customerGroup) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `CustomerGroup with ${id} was not found`
      )
    }

    return customerGroup
  }

  create(group: DeepPartial<CustomerGroup>): Promise<CustomerGroup> {
    return this.atomicPhase_(async (manager) => {
      try {
        const cgRepo: CustomerGroupRepository = manager.getCustomRepository(
          this.customerGroupRepository_
        )

        const created = cgRepo.create(group)

        const result = await cgRepo.save(created)

        return result
      } catch (err) {
        if (err.code === "23505") {
          throw new MedusaError(MedusaError.Types.DB_ERROR, err.detail)
        }
        throw err
      }
    })
  }
}

export default CustomerGroupService
