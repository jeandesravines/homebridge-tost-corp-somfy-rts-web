import { AxiosInstance } from "axios"

export default {
  create(): Partial<AxiosInstance> {
    return {
      request: jest.fn().mockResolvedValue({
        headers: {},
      }),
    }
  },
}
