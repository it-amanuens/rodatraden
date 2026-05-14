import string

def file_validation(file):

    # Specify the allowed length of file name
    # Index 0: Minimum length of file name
    # Index 1: Maximum length of file name
    allowed_filename = [2, 100]

    # Specify the allowed file size in kB
    # Index 0: Minimum file size
    # Index 1: Maximum file size
    allowed_filesize = [20, 300]

    # Checks if the length of the file name is
    if (len(file.name) < allowed_filename[0] or len(file.name) > allowed_filename[1]):
        print("The file name is either too short or too long! Allowed file name"
        "length: ",allowed_filename[0],"to ",allowed_filename[1],"characters")
        return 1

    # Cheks if the file size is allowed
    if ((file.size/1000) < allowed_filesize[0] or (file.size/1000) > allowed_filesize[1]):
        print("The file is either too big or too small! "
        "Allowed file size ",allowed_filesize[0],"to ",allowed_filesize[0],"kB")
        return 1

    return 0
