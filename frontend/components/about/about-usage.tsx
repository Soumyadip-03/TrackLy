export function AboutUsage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Getting Started</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Follow these steps to get started with the Attendance Tracker:
        </p>
        <ol className="mt-4 space-y-4 text-sm">
          <li className="flex items-start">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              1
            </span>
            <div>
              <p className="font-medium">Set up your profile</p>
              <p className="text-muted-foreground">
                Go to the Profile page and enter your name, student ID, and current semester.
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              2
            </span>
            <div>
              <p className="font-medium">Add your subjects</p>
              <p className="text-muted-foreground">
                In the Profile page, go to the Subjects tab and add all the subjects for your current semester.
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              3
            </span>
            <div>
              <p className="font-medium">Upload your schedule</p>
              <p className="text-muted-foreground">
                Upload your weekly class schedule PDF in the Schedule Upload tab of the Profile page.
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              4
            </span>
            <div>
              <p className="font-medium">Start tracking attendance</p>
              <p className="text-muted-foreground">
                Use the Attendance page to mark absences and track your attendance.
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div>
        <h3 className="text-lg font-medium">Using the Dashboard</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The Dashboard provides an overview of your attendance status:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>
              <span className="font-medium">Overall Attendance:</span> Shows your average attendance across all subjects
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>
              <span className="font-medium">Classes Attended:</span> Total number of classes attended vs. total classes
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>
              <span className="font-medium">Absences:</span> Total number of classes missed
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>
              <span className="font-medium">Points:</span> Your current points balance
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>
              <span className="font-medium">Attendance Charts:</span> Visual representation of your attendance trends
            </span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium">Attendance Calculators</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The system offers two types of calculators to help you plan your absences:
        </p>
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <p className="font-medium">Whole Day Calculator</p>
            <p className="text-muted-foreground">
              Use this calculator to mark entire days as absent and see the impact on your overall attendance. This
              option is free to use and doesn't cost any points.
            </p>
          </div>
          <div>
            <p className="font-medium">Per Subject Calculator</p>
            <p className="text-muted-foreground">
              Use this calculator to mark specific subjects as absent on a particular day. This option costs 2 points
              per use but gives you more flexibility in planning your absences.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Managing To-Do List</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The To-Do List feature helps you keep track of tasks for your classes:
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>Add tasks with titles, descriptions, and due dates</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>Associate tasks with specific subjects</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>Mark tasks as completed when finished</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-primary">•</span>
            <span>View pending and completed tasks separately</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
