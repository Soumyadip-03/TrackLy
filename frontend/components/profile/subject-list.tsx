"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Trash2, Edit, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

interface Subject {
  id: string
  name: string
  code: string
  classesPerWeek: number
  isEditing?: boolean
}

export function SubjectList() {
  // Get subjects from localStorage instead of using mock data
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Load saved subjects on component mount
  useEffect(() => {
    const savedSubjects = getFromLocalStorage<Subject[]>('subjects', []);
    setSubjects(savedSubjects);
  }, []);

  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: "",
    code: "",
    classesPerWeek: 0,
  })

  const [isAddingNew, setIsAddingNew] = useState(false)

  const handleAddNew = () => {
    setIsAddingNew(true)
    setNewSubject({
      name: "",
      code: "",
      classesPerWeek: 0,
    })
  }

  const handleCancelAdd = () => {
    setIsAddingNew(false)
  }

  const handleNewSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSubject((prev) => ({
      ...prev,
      [name]: name === "classesPerWeek" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSaveNewSubject = () => {
    if (!newSubject.name || !newSubject.code) {
      toast({
        title: "Error",
        description: "Subject name and code are required.",
        variant: "destructive",
      })
      return
    }

    const id = Math.random().toString(36).substring(2, 9)
    const updatedSubjects = [...subjects, { id, ...(newSubject as Subject) }]
    setSubjects(updatedSubjects)
    saveToLocalStorage('subjects', updatedSubjects);
    setIsAddingNew(false)

    toast({
      title: "Subject Added",
      description: `${newSubject.name} has been added to your subjects.`,
    })
  }

  const handleEdit = (id: string) => {
    setSubjects((prev) => prev.map((subject) => (subject.id === id ? { ...subject, isEditing: true } : subject)))
  }

  const handleEditChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === id
          ? {
              ...subject,
              [name]: name === "classesPerWeek" ? Number.parseInt(value) || 0 : value,
            }
          : subject,
      ),
    )
  }

  const handleSaveEdit = (id: string) => {
    const updatedSubjects = subjects.map((subject) => (subject.id === id ? { ...subject, isEditing: false } : subject));
    setSubjects(updatedSubjects)
    saveToLocalStorage('subjects', updatedSubjects);

    toast({
      title: "Subject Updated",
      description: "Subject information has been updated successfully.",
    })
  }

  const handleDelete = (id: string) => {
    const updatedSubjects = subjects.filter((subject) => subject.id !== id);
    setSubjects(updatedSubjects)
    saveToLocalStorage('subjects', updatedSubjects);

    toast({
      title: "Subject Deleted",
      description: "Subject has been removed from your list.",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subject List</CardTitle>
          <CardDescription>Manage your semester subjects</CardDescription>
        </div>
        <Button onClick={handleAddNew} disabled={isAddingNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject Name</TableHead>
              <TableHead>Subject Code</TableHead>
              <TableHead>Classes Per Week</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    {subject.isEditing ? (
                      <Input name="name" value={subject.name} onChange={(e) => handleEditChange(subject.id, e)} />
                    ) : (
                      subject.name
                    )}
                  </TableCell>
                  <TableCell>
                    {subject.isEditing ? (
                      <Input name="code" value={subject.code} onChange={(e) => handleEditChange(subject.id, e)} />
                    ) : (
                      subject.code
                    )}
                  </TableCell>
                  <TableCell>
                    {subject.isEditing ? (
                      <Input
                        name="classesPerWeek"
                        type="number"
                        value={subject.classesPerWeek}
                        onChange={(e) => handleEditChange(subject.id, e)}
                      />
                    ) : (
                      subject.classesPerWeek
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {subject.isEditing ? (
                      <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(subject.id)}>
                        <Save className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(subject.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No subjects added yet. Add your first subject to get started.
                </TableCell>
              </TableRow>
            )}

            {isAddingNew && (
              <TableRow>
                <TableCell>
                  <Input
                    name="name"
                    placeholder="Subject Name"
                    value={newSubject.name || ""}
                    onChange={handleNewSubjectChange}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    name="code"
                    placeholder="Subject Code"
                    value={newSubject.code || ""}
                    onChange={handleNewSubjectChange}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    name="classesPerWeek"
                    type="number"
                    placeholder="Classes Per Week"
                    value={newSubject.classesPerWeek || ""}
                    onChange={handleNewSubjectChange}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={handleSaveNewSubject}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCancelAdd}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
