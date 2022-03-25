import { NextFunction, Request, Response } from "express"
import { getRepository } from "typeorm"
import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"

export class GroupController {
  private groupRepository = getRepository(Group)

  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of all groups
    return this.groupRepository.find()
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Add a Group
    try {
      const { body: payload } = request

      const createGroupInput: CreateGroupInput = {
        name: payload.name,
        number_of_weeks: payload.number_of_weeks,
        roll_states: payload.roll_states,
        incidents: payload.incidents,
        ltmt: payload.ltmt,
      }
      const group = new Group()
      group.prepareToCreate(createGroupInput)
      const groupResponse = await this.groupRepository.save(group)
      return {
        statusCode: 200,
        message: "Created group",
        Data: groupResponse,
      }
    } catch (error) {
      console.error("ERROR_CREATE_GROUP", error)
      return { code: 500, message: "Internal server error", error }
    }
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Update a Group
    try {
      const { body: params } = request

      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.ltmt,
        run_at: params.run_at,
        student_count: params.student_count,
      }

      const groupToUpdate = await this.groupRepository.findOne({ id: params.id })

      if (groupToUpdate) {
        const updates = new Group()
        updates.prepareToUpdate(updateGroupInput)
        return this.groupRepository.save({ id: groupToUpdate.id, ...updates })
      } else {
        return {
          code: 404,
          message: "Group not found",
        }
      }
    } catch (error) {
      return {
        code: 500,
        message: "Internal server error",
        error,
      }
    }
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Delete a Group
    try {
      let removeGroup = await this.groupRepository.findOne(request.params.id)
      if (removeGroup) {
        await this.groupRepository.delete(removeGroup)
        return {
          Message: "Group Successfully Deleted",
        }
      }
    } catch (error) {
      console.error("ERROR_REMOVE_GROUP", error)
      return {
        Messsage: "Internal server error",
      }
    }
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    // Return the list of Students that are in a Group
  }

  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
    // 1. Clear out the groups (delete all the students from the groups)
    // 2. For each group, query the student rolls to see which students match the filter for the group
    // 3. Add the list of students that match the filter to the group
  }
}
