import categoryApiRequest from '@/apiRequests/category'
import { UpdateCategoryBodyType } from '@/schemaValidations/category.schema'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCategoryListQuery = () => {
  return useQuery({
    queryKey: ['categoryes'],
    queryFn: categoryApiRequest.list
  })
}

export const useGetCategoryQuery = ({
  id,
  enabled
}: {
  id: number
  enabled: boolean
}) => {
  return useQuery({
    queryKey: ['categoryes', id],
    queryFn: () => categoryApiRequest.getCategory(id),
    enabled
  })
}

export const useAddCategoryMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoryApiRequest.add,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categoryes']
      })
    }
  })
}

export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateCategoryBodyType & { id: number }) =>
      categoryApiRequest.updateCategory(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categoryes'],
        exact: true
      })
    }
  })
}

export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: categoryApiRequest.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['categoryes']
      })
    }
  })
}
