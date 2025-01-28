"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader, Plus, X, Edit2 } from "lucide-react";
import { supportedFrameworks } from "@/config/constant";
import {
  SetupProjectFormData,
  formSchema,
} from "@/lib/schema/setupProjectSchema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DirectoryTree, { TreeNode } from "@/components/DirectoryTree";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetTreeMutation } from "@/redux/api/userApiSlice";
import { useSearchParams, useRouter } from "next/navigation";
import { createProject } from "@/services/createProject";

export default function SetupProject() {
  const params = useSearchParams();
  const router = useRouter();
  const repo = params.get("repo")!;
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [selectedRootDir, setSelectedRootDir] = useState<string>("");
  const [children, setChildren] = useState<TreeNode[] | null>(null);
  const [getTree, { isLoading }] = useGetTreeMutation();

  const form = useForm<SetupProjectFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectName: repo,
      framework: "",
      envVars: [{ key: "", value: "" }],
      rootDir: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "envVars",
  });

  const handleSelectDirectory = (path: string) => {
    setSelectedRootDir(path);
    setValue("rootDir", path);
    setIsDirectoryModalOpen(false);
  };

  const onSubmit = async (data: SetupProjectFormData) => {
    try {
      createProject(data);
    } catch (error) {
      //TODO:
      console.log(error);
    }
  };

  useEffect(() => {
    // TODO:Show toast
    if (!repo) {
      router.push("/select-repo");
    }
    const tree = async () => {
      try {
        const res = await getTree({ repo, sha: "main" }).unwrap();
        setChildren(res.tree);
      } catch (error) {
        // TODO:
        console.log(error);
      }
    };
    tree();
  }, []);
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border-rose-200 dark:border-rose-800">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Set Up Your Project
          </CardTitle>
          <CardDescription>
            Configure your project for deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Project Name</Label>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-200 dark:border-gray-700"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="framework"
                render={({ field }) => (
                  <FormItem>
                    <Label>Framework</Label>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="Select a framework" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedFrameworks.map((fw) => (
                            <SelectItem key={fw.value} value={fw.value}>
                              {fw.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="rootDir"
                render={({ field }) => (
                  <FormItem>
                    <Label>Root Directory</Label>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          {...field}
                          className="border-gray-200 dark:border-gray-700"
                          disabled
                          value={selectedRootDir}
                        />
                        <Dialog
                          open={isDirectoryModalOpen}
                          onOpenChange={setIsDirectoryModalOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="ml-2 bg-dark-900"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Select Root Directory</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[300px] overflow-y-auto">
                              {isLoading ? (
                                <>
                                  <Loader className="h-4 w-4 animate-spin" />
                                </>
                              ) : (
                                <DirectoryTree
                                  data={{
                                    path: "",
                                    sha: "main",
                                    children: children!,
                                  }}
                                  onSelect={handleSelectDirectory}
                                  selectedPath={selectedRootDir}
                                  repository={repo}
                                  currentPath={""}
                                />
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="">Environment Variables</Label>
                <div className="flex flex-col gap-y-3 mt-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField
                        control={control}
                        name={`envVars.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="w-[47%]">
                            <FormControl>
                              <Input placeholder="Key" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`envVars.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="w-[47%]">
                            <FormControl>
                              <Input placeholder="Value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => remove(index)}
                        className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500 dark:bg-neutral-900"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ key: "", value: "" })}
                  className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500 dark:bg-neutral-900 mt-4 mb-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Environment Variable
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy Project"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
