import os, time

# set directory to delete files from
directory = '/Users/Anna/desktop/projekt/rodatraden/excel'

# Files in 'directory' that are older than 'age_days' will be deleted
age_days = 1

# Convert 'age_days' to seconds
age_seconds = int(age_days)*24*60*60

# Current time
now = time.time()

# Deletes files with the specified extensions
remove_extensions = [".xls", ".xlsm", ".xlsx"]

print("Searching directory for files older than days")

# Loop over the entries in the specified directory
for file in os.listdir(directory):
	file_path = os.path.join(directory, file)
	modified = os.stat(file_path).st_mtime
	# If the entry is older than the specified age and if the
	# entry is a file with the correct extension, delete file
	if modified < (now - age_seconds):
		if os.path.isfile(file_path):
			file_extension = os.path.splitext(file_path)[1]
			if (file_extension == i for i in remove_extensions):
				# OBS!!!!! Remove # only when you are certain that the code does what you want it to do
				#os.remove(file_path)
				print ("Deleted: %s (%s)" % (file, modified))
