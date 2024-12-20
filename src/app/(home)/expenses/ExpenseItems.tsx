"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  type SortDescriptor,
  Tooltip,
  Link,
} from "@nextui-org/react";
import { Expense } from "./page";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Key, useMemo, useRef, useState } from "react";
import ExpenseForm from "./ExpenseForm";
import deleteAnExpense from "@/actions/Expense/deleteExpense";
import toast from "react-hot-toast";

const TABLE_HEADERS = [
  { label: "Date", isSortable: true, key: "date" },
  { label: "Amount", isSortable: true, key: "amount" },
  { label: "Category", isSortable: true, key: "category" },
  { label: "Description", isSortable: true, key: "description" },
  { label: "Actions", key: "actions" },
];
const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "TRY", symbol: "₺" },
  { code: "AZN", symbol: "₼" },
];
const DESCRIPTION_TRUNCATE_LENGTH = 40;

const ExpenseItems: React.FC<{
  userId: string | null | undefined;
  expenses: Expense[];
  expensesLoading: boolean;
  onExpenseDeletionFinished: (deletedExpense: Expense) => void;
  onExpenseCreation: (createdExpense: Expense) => void;
  onExpenseUpdate: (updatedExpense: Expense) => void;
}> = ({
  userId,
  expenses,
  onExpenseDeletionFinished,
  onExpenseCreation,
  onExpenseUpdate,
  expensesLoading,
}) => {
  const updateTriggerRef = useRef(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDescriptionFor, setShowDescriptionFor] = useState<Set<string>>(
    new Set()
  ); // Set to store expense IDs whose description is expanded
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "date",
    direction: "descending",
  });

  const {
    isOpen: editModelOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalChange,
  } = useDisclosure();
  const {
    isOpen: deleteModelOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalChange,
  } = useDisclosure();
  const handleEditModalOpen = (expense: Expense) => {
    onEditModalOpen();
    setEditExpense(expense);
  };
  const handleDeleteModalOpen = (expense: Expense) => {
    onDeleteModalOpen();
    setDeleteExpense(expense);
  };
  const handleDeleteExpense = async (id: string) => {
    try {
      setDeleteLoading(true);
      const data = await deleteAnExpense(id);
      if (data) {
        onExpenseDeletionFinished(data);
        toast.success("Expense deleted successfully");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setDeleteLoading(false);
    }
  };
  const handleUpdateButtonClick = () => {
    updateTriggerRef.current = true;
    setUpdateLoading(true);
  };
  const handleExpenseCreation = (expense: Expense) => {
    onExpenseCreation(expense);
  };
  const handleExpenseUpdate = (expense: Expense) => {
    onExpenseUpdate(expense);
  };
  const handleUpdateFinished = () => {
    updateTriggerRef.current = false;
    setUpdateLoading(false);
    setEditExpense(null);
  };
  const handleRead = (expenseId: string) => {
    setShowDescriptionFor((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };
  const sortedItems = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Expense];
      const second = b[sortDescriptor.column as keyof Expense];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, expenses]);

  return (
    <>
      <Modal
        isOpen={deleteModelOpen}
        placement="auto"
        onOpenChange={onDeleteModalChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-col space-y-1.5">
                <p>Delete Expense</p>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this expense? This action
                  cannot be undone.
                </p>
              </ModalHeader>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  isDisabled={deleteLoading}
                  isLoading={deleteLoading}
                  color="danger"
                  onPress={async () => {
                    if (deleteExpense) {
                      await handleDeleteExpense(deleteExpense?.id); // Fix: Directly pass the correct expense.id here
                      onClose(); // Close modal after deletion
                    }
                  }}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal
        isOpen={editModelOpen}
        placement="auto"
        onOpenChange={onEditModalChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex-col space-y-1.5">
                <p>Edit Expense</p>
                <p className="text-sm text-muted-foreground">
                  Make changes to your expense here. Click save when you&apos;re
                  done.
                </p>
              </ModalHeader>
              <ModalBody>
                <ExpenseForm
                  userId={userId}
                  onExpenseCreated={handleExpenseCreation}
                  isEditing={true}
                  editingExpense={editExpense}
                  updateTriggerState={updateTriggerRef}
                  onUpdateExpense={(expense) => {
                    handleExpenseUpdate(expense);
                    onClose();
                  }}
                  onUpdateFinished={handleUpdateFinished}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  isDisabled={updateLoading}
                  isLoading={updateLoading}
                  onClick={handleUpdateButtonClick}
                >
                  {!updateLoading && "Update Expense"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Table
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        removeWrapper
        classNames={{ base: "w-full overflow-auto" }}
        aria-label="Expense table"
      >
        <TableHeader columns={TABLE_HEADERS}>
          {(column) => (
            <TableColumn allowsSorting={column?.isSortable} key={column.key}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={sortedItems}
          loadingContent={<Spinner label="Loading..." />}
          isLoading={expensesLoading}
        >
          {sortedItems.map((expense, index) => (
            <TableRow
              key={expense.id}
              className={`${
                index === sortedItems.length - 1 ? "" : "border-b border-border"
              } hover:bg-muted transition-colors duration-200 ease-in-out`}
            >
              <TableCell className="whitespace-nowrap">
                {format(expense.date, "MMM d, yyyy, h:mm a")}
              </TableCell>
              <TableCell>
                {currencies.find((c) => c.code === expense.currency)?.symbol}
                {expense.amount.toFixed(2)} {expense.currency}
              </TableCell>
              <TableCell>{expense.category}</TableCell>
              <TableCell className="min-w-[200px]">
                {expense.description.length > DESCRIPTION_TRUNCATE_LENGTH ? (
                  <>
                    {showDescriptionFor.has(expense.id)
                      ? expense.description
                      : `${expense.description.slice(
                          0,
                          DESCRIPTION_TRUNCATE_LENGTH
                        )}...`}
                    <Link
                      onClick={() => handleRead(expense.id)}
                      className="text-muted-foreground cursor-pointer block"
                      size="sm"
                      underline="hover"
                      aria-expanded={showDescriptionFor.has(expense.id)}
                    >
                      {showDescriptionFor.has(expense.id)
                        ? "Read less"
                        : "Read more"}
                    </Link>
                  </>
                ) : (
                  expense.description
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2 items-center">
                  <Button
                    className="min-w-8 min-h-8 h-full rounded-xl p-3"
                    variant="light"
                    size="sm"
                    onPress={() => handleEditModalOpen(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    className="min-w-8 min-h-8 h-full rounded-xl p-3"
                    onPress={() => handleDeleteModalOpen(expense)}
                    color="danger"
                    size="md"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default ExpenseItems;
