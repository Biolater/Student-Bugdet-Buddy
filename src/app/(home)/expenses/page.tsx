"use client";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Skeleton,
  useDisclosure,
} from "@nextui-org/react";
import { DateRangePicker } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/select";
import { Button } from "@nextui-org/button";
import { useAuth } from "@clerk/nextjs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import toast from "react-hot-toast";
import { format } from "date-fns";
import ExpenseForm from "./ExpenseForm";

export type Expense = {
  id: string;
  userId: string;
  amount: string;
  category: string;
  description: string;
  currency: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
};
const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "TRY", symbol: "₺" },
  { code: "AZN", symbol: "₼" },
];

const categories = [
  { code: "Food", symbol: "🍔" },
  { code: "Entertainment", symbol: "🎉" },
  { code: "Transport", symbol: "🚗" },
  { code: "Health", symbol: "💊" },
  { code: "Education", symbol: "📚" },
  { code: "Clothing", symbol: "👕" },
  { code: "Pets", symbol: "🐶" },
  { code: "Travel", symbol: "🌳" },
  { code: "Other", symbol: "🤷‍♀️" },
];

const categories2 = [{ code: "All Categories", symbol: "" }, ...categories];

const TABLE_HEADERS = ["Date", "Amount", "Category", "Description", "Actions"];

const ExpenseTracker = () => {
  // const [filterCategory, setFilterCategory] = useState<Category>("Food");
  const updateTriggerRef = useRef(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

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
  const { userId } = useAuth();

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const filterCategory = e.target.value;
    if (filterCategory === "All Categories") {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(
        expenses.filter((expense) => expense.category === filterCategory)
      );
    }
  };

  const handleEditModalOpen = (expense: Expense) => {
    onEditModalOpen();
    setEditExpense(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    const options = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    };
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/expenses?expenseId=${id}`, options);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      if (data) {
        setExpenses((prevExpenses) =>
          prevExpenses.filter((expense) => expense.id !== id)
        );
        setFilteredExpenses((prevExpenses) =>
          prevExpenses.filter((expense) => expense.id !== id)
        );
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

  const handleDeleteModalOpen = (expense: Expense) => {
    onDeleteModalOpen();
    setDeleteExpense(expense);
  };

  const handleExpenseCreation = (expense: Expense) => {
    setExpenses((prevExpenses) => [expense, ...prevExpenses]);
    setFilteredExpenses((prevExpenses) => [expense, ...prevExpenses]);
  };

  const handleUpdateButtonClick = () => {
    updateTriggerRef.current = true;
    setUpdateLoading(true);
  };

  const handleExpenseUpdate = (expense: Expense) => {
    setExpenses((prevExpenses) =>
      prevExpenses.map((prevExpense) =>
        prevExpense.id === expense.id ? expense : prevExpense
      )
    );
    setFilteredExpenses((prevExpenses) =>
      prevExpenses.map((prevExpense) =>
        prevExpense.id === expense.id ? expense : prevExpense
      )
    );
  };

  const handleUpdateFinished = () => {
    updateTriggerRef.current = false;
    setUpdateLoading(false);
    setEditExpense(null);
  };

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setExpensesLoading(true);
        if (userId) {
          const response = await fetch(`/api/expenses?userId=${userId}`);
          if (!response.ok) {
            throw new Error(response.statusText);
          }
          const data: Expense[] = await response.json();
          setExpenses(data);
          setFilteredExpenses(data);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        setExpensesLoading(false);
      }
    };
    fetchExpenses();
  }, [userId]);

  return (
    <div className="container max-w-4xl mx-auto p-4">
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
                  onClick={async () => {
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
      <Card aria-labelledby="expense-tracker">
        <CardHeader className="flex-col items-start p-6">
          <h3 className="font-semibold tracking-tight text-2xl sm:text-3xl">
            Expense Tracker
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base">
            Keep track of your expenses easily.
          </p>
        </CardHeader>
        <CardBody className="p-6 pt-0">
          <ExpenseForm
            userId={userId}
            onExpenseCreated={handleExpenseCreation}
          />
        </CardBody>
        <CardFooter className="p-6 pt-0 flex flex-col gap-4">
          <div className="gap-3 w-full grid grid-cols-1 sm:grid-cols-2">
            <Select
              onChange={handleFilterChange}
              defaultSelectedKeys={["All Categories"]}
              aria-labelledby="filter"
            >
              {categories2.map((category) => (
                <SelectItem key={`${category.code}`} value={category.code}>
                  {`${category.symbol} ${category.code}`}
                </SelectItem>
              ))}
            </Select>
            <div className="relative">
              <Button className="relative w-full">Filter by Date Range</Button>
              <DateRangePicker className="expenses-date-range opacity-0 inset-0" />
            </div>
          </div>
          <Table
            removeWrapper
            classNames={{ base: "w-full overflow-auto" }}
            aria-label="Expense table"
          >
            <TableHeader>
              {TABLE_HEADERS.map((column, idx) => (
                <TableColumn key={`${column}-${idx}`}>{column}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {expensesLoading
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px] rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[80px] rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px] rounded-lg" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-[200px] rounded-lg" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-[80px] rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredExpenses.map((expense, idx) => (
                    <TableRow
                      className={`${
                        idx !== filteredExpenses.length - 1 &&
                        "border-b border-border"
                      } hover:bg-muted transition-colors duration-200 ease-in-out`}
                      key={expense.id}
                    >
                      <TableCell>{format(expense.date, "PP")}</TableCell>
                      <TableCell>
                        {
                          currencies.find((c) => c.code === expense.currency)
                            ?.symbol
                        }
                        {parseFloat(expense.amount).toFixed(2)}{" "}
                        {expense.currency}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default ExpenseTracker;
